Add-Type -AssemblyName System.Drawing

function New-VereonIcon {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Rounded rectangle background (#16a34a)
    $green  = [System.Drawing.Color]::FromArgb(22, 163, 74)
    $brush  = New-Object System.Drawing.SolidBrush($green)
    $radius = [int]($Size * 0.156)
    $d      = $radius * 2
    $gp     = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gp.AddArc(0,            0,            $d, $d, 180, 90)
    $gp.AddArc($Size - $d,   0,            $d, $d, 270, 90)
    $gp.AddArc($Size - $d,   $Size - $d,   $d, $d,   0, 90)
    $gp.AddArc(0,            $Size - $d,   $d, $d,  90, 90)
    $gp.CloseFigure()
    $g.FillPath($brush, $gp)

    # White "V" centered
    $fontSize = [float]($Size * 0.62)
    $font  = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf    = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rf = [System.Drawing.RectangleF]::new(0, 0, $Size, $Size)
    $g.DrawString("V", $font, $white, $rf, $sf)

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Erstellt: $Path ($Size x $Size px)"
}

$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

New-VereonIcon -Size 192 -Path (Join-Path $root "public\icon-192.png")
New-VereonIcon -Size 512 -Path (Join-Path $root "public\icon-512.png")
New-VereonIcon -Size 180 -Path (Join-Path $root "public\apple-touch-icon.png")

Write-Host ""
Write-Host "Fertig. Alle drei Icon-Dateien liegen in public/."
Write-Host "Diese Icons sind MVP-Platzhalter und werden durch finale Brand-Icons ersetzt."
