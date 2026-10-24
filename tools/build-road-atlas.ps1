param(
  [Parameter(Mandatory = $true)][string]$Frame0,
  [Parameter(Mandatory = $true)][string]$Frame1,
  [Parameter(Mandatory = $true)][string]$Output
)

Add-Type -AssemblyName System.Drawing

$atlas = New-Object System.Drawing.Bitmap 4096, 2048, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($atlas)
$graphics.Clear([System.Drawing.Color]::FromArgb(255, 139, 138, 134))
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

function Draw-RoadFrame([string]$Path, [int]$DestinationX) {
  $source = [System.Drawing.Image]::FromFile($Path)
  try {
    $targetAspect = 16.0 / 9.0
    $sourceAspect = $source.Width / [double]$source.Height
    if ($sourceAspect -gt $targetAspect) {
      $cropHeight = $source.Height
      $cropWidth = [int][Math]::Round($cropHeight * $targetAspect)
      $cropX = [int][Math]::Round(($source.Width - $cropWidth) / 2)
      $cropY = 0
    } else {
      $cropWidth = $source.Width
      $cropHeight = [int][Math]::Round($cropWidth / $targetAspect)
      $cropX = 0
      $cropY = [int][Math]::Round(($source.Height - $cropHeight) / 2)
    }

    $destination = New-Object System.Drawing.Rectangle $DestinationX, 448, 2048, 1152
    $crop = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropWidth, $cropHeight
    $graphics.DrawImage($source, $destination, $crop, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $source.Dispose()
  }
}

try {
  Draw-RoadFrame $Frame0 0
  Draw-RoadFrame $Frame1 2048
  $atlas.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $atlas.Dispose()
}
