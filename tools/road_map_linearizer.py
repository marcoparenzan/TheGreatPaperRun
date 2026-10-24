"""Convert a hand-drawn route into a linear road-key sequence.

The source image should contain one dark route on a light or transparent background.
The first point defaults to the lowest endpoint in the image; pass ``start_hint``
when the intended start is elsewhere.
"""

from __future__ import annotations

import argparse
import json
import math
from collections import deque
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np
from PIL import Image


Point = tuple[float, float]
Pixel = tuple[int, int]


@dataclass(frozen=True)
class RoadStep:
    index: int
    key: str
    distance_px: float
    turn_degrees: float
    source_point: Point


class RoadMapLinearizer:
    """Trace, sample and quantize a drawn centerline."""

    def __init__(
        self,
        sample_distance_px: float = 24.0,
        straight_limit_deg: float = 2.0,
        medium_limit_deg: float = 8.0,
        hard_limit_deg: float = 16.0,
        threshold: int = 110,
    ) -> None:
        self.sample_distance_px = sample_distance_px
        self.straight_limit_deg = straight_limit_deg
        self.medium_limit_deg = medium_limit_deg
        self.hard_limit_deg = hard_limit_deg
        self.threshold = threshold

    def linearize_image(
        self, image_path: str | Path, start_hint: Point | None = None
    ) -> dict:
        mask = self._load_mask(image_path)
        skeleton = self._thin(mask)
        path = self._main_path(skeleton, start_hint)
        samples = self._smooth(self._resample(path, self.sample_distance_px), radius=3)
        steps = self.linearize_points(samples)
        return {
            "version": 1,
            "source": Path(image_path).name,
            "sampleDistancePx": self.sample_distance_px,
            "sequence": [step.key for step in steps],
            "segments": self._segments(steps),
            "steps": [asdict(step) for step in steps],
        }

    def linearize_points(self, points: Sequence[Point]) -> list[RoadStep]:
        if len(points) < 2:
            raise ValueError("At least two sampled points are required")

        steps: list[RoadStep] = []
        previous_key = "straight"
        for index, point in enumerate(points):
            if index == 0 or index == len(points) - 1:
                turn = 0.0
            else:
                turn = self._signed_turn(points[index - 1], point, points[index + 1])

            key = self._turn_key(turn)
            # A single straight sample between equal turns is usually drawing noise.
            if key == "straight" and 0 < index < len(points) - 1:
                next_turn = self._signed_turn(point, points[index + 1], points[min(index + 2, len(points) - 1)])
                next_key = self._turn_key(next_turn)
                if previous_key == next_key and next_key != "straight":
                    key = previous_key

            steps.append(
                RoadStep(
                    index=index,
                    key=key,
                    distance_px=index * self.sample_distance_px,
                    turn_degrees=round(turn, 3),
                    source_point=(round(point[0], 2), round(point[1], 2)),
                )
            )
            previous_key = key
        return steps

    def _load_mask(self, image_path: str | Path) -> np.ndarray:
        rgba = np.asarray(Image.open(image_path).convert("RGBA"))
        rgb = rgba[..., :3].astype(np.float32)
        alpha = rgba[..., 3]
        luminance = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
        return (alpha > 16) & (luminance < self.threshold)

    @staticmethod
    def _thin(mask: np.ndarray) -> np.ndarray:
        """Zhang-Suen thinning, implemented locally to avoid an OpenCV dependency."""
        image = mask.astype(np.uint8).copy()
        changed = True
        while changed:
            changed = False
            for phase in (0, 1):
                padded = np.pad(image, 1)
                p2 = padded[:-2, 1:-1]
                p3 = padded[:-2, 2:]
                p4 = padded[1:-1, 2:]
                p5 = padded[2:, 2:]
                p6 = padded[2:, 1:-1]
                p7 = padded[2:, :-2]
                p8 = padded[1:-1, :-2]
                p9 = padded[:-2, :-2]
                neighbours = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
                transitions = (
                    ((p2 == 0) & (p3 == 1)).astype(np.uint8)
                    + ((p3 == 0) & (p4 == 1)).astype(np.uint8)
                    + ((p4 == 0) & (p5 == 1)).astype(np.uint8)
                    + ((p5 == 0) & (p6 == 1)).astype(np.uint8)
                    + ((p6 == 0) & (p7 == 1)).astype(np.uint8)
                    + ((p7 == 0) & (p8 == 1)).astype(np.uint8)
                    + ((p8 == 0) & (p9 == 1)).astype(np.uint8)
                    + ((p9 == 0) & (p2 == 1)).astype(np.uint8)
                )
                if phase == 0:
                    guards = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
                else:
                    guards = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
                remove = (image == 1) & (neighbours >= 2) & (neighbours <= 6) & (transitions == 1) & guards
                if np.any(remove):
                    image[remove] = 0
                    changed = True
        return image.astype(bool)

    def _main_path(self, skeleton: np.ndarray, start_hint: Point | None) -> list[Pixel]:
        nodes = {(int(x), int(y)) for y, x in np.argwhere(skeleton)}
        if not nodes:
            raise ValueError("No dark route found in the source image")

        components: list[set[Pixel]] = []
        remaining = set(nodes)
        while remaining:
            seed = remaining.pop()
            component = {seed}
            queue = [seed]
            while queue:
                current = queue.pop()
                for neighbour in self._neighbours(current):
                    if neighbour in remaining:
                        remaining.remove(neighbour)
                        component.add(neighbour)
                        queue.append(neighbour)
            components.append(component)
        nodes = max(components, key=len)

        endpoints = [node for node in nodes if sum(n in nodes for n in self._neighbours(node)) == 1]
        candidates = endpoints or list(nodes)
        if start_hint is None:
            start = max(candidates, key=lambda p: p[1])
        else:
            start = min(candidates, key=lambda p: (p[0] - start_hint[0]) ** 2 + (p[1] - start_hint[1]) ** 2)

        distance, parent = self._breadth_first(start, nodes)
        endpoint_candidates = [node for node in endpoints if node != start] or list(distance)
        end = max(endpoint_candidates, key=lambda p: distance.get(p, -1))

        result = [end]
        while result[-1] != start:
            result.append(parent[result[-1]])
        result.reverse()
        return result

    @staticmethod
    def _neighbours(point: Pixel) -> Iterable[Pixel]:
        x, y = point
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx or dy:
                    yield x + dx, y + dy

    def _breadth_first(self, start: Pixel, nodes: set[Pixel]) -> tuple[dict[Pixel, int], dict[Pixel, Pixel]]:
        distance = {start: 0}
        parent: dict[Pixel, Pixel] = {}
        queue = deque([start])
        while queue:
            current = queue.popleft()
            for neighbour in self._neighbours(current):
                if neighbour in nodes and neighbour not in distance:
                    distance[neighbour] = distance[current] + 1
                    parent[neighbour] = current
                    queue.append(neighbour)
        return distance, parent

    @staticmethod
    def _resample(points: Sequence[Point], spacing: float) -> list[Point]:
        result = [points[0]]
        carry = 0.0
        for start, end in zip(points, points[1:]):
            dx, dy = end[0] - start[0], end[1] - start[1]
            length = math.hypot(dx, dy)
            if length == 0:
                continue
            position = spacing - carry
            while position <= length:
                ratio = position / length
                result.append((start[0] + dx * ratio, start[1] + dy * ratio))
                position += spacing
            carry = max(0.0, length - (position - spacing))
        if result[-1] != points[-1]:
            result.append(points[-1])
        return result

    @staticmethod
    def _smooth(points: Sequence[Point], radius: int) -> list[Point]:
        if radius <= 0 or len(points) < 3:
            return list(points)
        result: list[Point] = []
        for index in range(len(points)):
            start = max(0, index - radius)
            end = min(len(points), index + radius + 1)
            window = points[start:end]
            result.append((
                sum(point[0] for point in window) / len(window),
                sum(point[1] for point in window) / len(window),
            ))
        return result

    @staticmethod
    def _signed_turn(a: Point, b: Point, c: Point) -> float:
        first = (b[0] - a[0], b[1] - a[1])
        second = (c[0] - b[0], c[1] - b[1])
        cross = first[0] * second[1] - first[1] * second[0]
        dot = first[0] * second[0] + first[1] * second[1]
        # Image Y grows downward; invert the mathematical sign so negative is left.
        return math.degrees(math.atan2(cross, dot))

    def _turn_key(self, turn_degrees: float) -> str:
        magnitude = abs(turn_degrees)
        if magnitude < self.straight_limit_deg:
            return "straight"
        direction = "left" if turn_degrees < 0 else "right"
        if magnitude < self.medium_limit_deg:
            strength = "gentle"
        elif magnitude < self.hard_limit_deg:
            strength = "medium"
        else:
            strength = "hard"
        return f"{direction}_{strength}"

    @staticmethod
    def _segments(steps: Sequence[RoadStep]) -> list[dict]:
        segments: list[dict] = []
        for step in steps:
            if not segments or segments[-1]["key"] != step.key:
                segments.append({"key": step.key, "count": 1})
            else:
                segments[-1]["count"] += 1
        return segments


def _parse_point(value: str) -> Point:
    x, y = value.split(",", 1)
    return float(x), float(y)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--start", type=_parse_point, help="start hint as x,y; default is lowest endpoint")
    parser.add_argument("--sample", type=float, default=24.0, help="pixels represented by one road frame")
    args = parser.parse_args()

    result = RoadMapLinearizer(sample_distance_px=args.sample).linearize_image(args.source, args.start)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
