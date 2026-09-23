Add-Type -AssemblyName System.Drawing

$imgDir = "h:\Track\public\images"
if (!(Test-Path $imgDir)) {
    New-Item -ItemType Directory -Force -Path $imgDir | Out-Null
}

function Create-ShowcaseImage($filename, $w, $h, $title, $sub, $ptX, $ptY) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(26,26,32), [System.Drawing.Color]::FromArgb(8,8,12), 45.0)
    $g.FillRectangle($brush, $rect)

    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(15, 255, 255, 255), 1)
    for ($x = 0; $x -lt $w; $x += 80) {
        $g.DrawLine($gridPen, $x, 0, $x, $h)
    }
    for ($y = 0; $y -lt $h; $y += 80) {
        $g.DrawLine($gridPen, 0, $y, $w, $y)
    }

    $sx = [int]($w * $ptX)
    $sy = [int]($h * $ptY)
    $glowRect = New-Object System.Drawing.Rectangle(($sx - 180), ($sy - 180), 360, 360)
    $pathGlow = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathGlow.AddEllipse($glowRect)
    $pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathGlow)
    $pgb.CenterColor = [System.Drawing.Color]::FromArgb(70, 255, 214, 10)
    $pgb.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $g.FillEllipse($pgb, $glowRect)

    $sq = 200
    $boxPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 214, 10), 3)
    $g.DrawRectangle($boxPen, ($sx - [int]($sq/2)), ($sy - [int]($sq/2)), $sq, $sq)
    $g.DrawLine($boxPen, ($sx - 15), $sy, ($sx + 15), $sy)
    $g.DrawLine($boxPen, $sx, ($sy - 15), $sx, ($sy + 15))

    $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 214, 10))
    $badgeFont = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
    $g.FillRectangle($badgeBrush, ($sx - 50), ($sy - [int]($sq/2) - 28), 100, 22)
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $g.DrawString("LOCK POINT", $badgeFont, $blackBrush, [float]($sx - 44), [float]($sy - [int]($sq/2) - 24))

    $fontTitle = New-Object System.Drawing.Font('Arial', 32, [System.Drawing.FontStyle]::Bold)
    $fontSub = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Regular)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 255, 255, 255))
    $yellowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 214, 10))

    $g.DrawString($title, $fontTitle, $whiteBrush, 60.0, [float]($h - 130))
    $g.DrawString($sub, $fontSub, $yellowBrush, 60.0, [float]($h - 80))

    $targetPath = Join-Path $imgDir $filename
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created: $filename"
}

function Create-StickerImage($filename, $label, $bgColorHex) {
    $bmp = New-Object System.Drawing.Bitmap(256, 256)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($bgColorHex))
    $g.FillEllipse($brush, 16, 16, 224, 224)

    $font = New-Object System.Drawing.Font('Arial', 18, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString($label, $font, $textBrush, 128.0, 128.0, $sf)

    $targetPath = Join-Path $imgDir $filename
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created: $filename"
}

Create-ShowcaseImage "hero-portrait.jpg" 1792 1008 "MOTION TRACKING STUDIO" "TRACKPOINT: NOSE & FACE LOCK (0.662, 0.49)" 0.662 0.49
Create-ShowcaseImage "reframe-dancer.jpg" 1792 1008 "WARM LIGHT DANCER" "AUTO-REFRAME: 16:9 TO 9:16 DYNAMIC" 0.615 0.43
Create-ShowcaseImage "track-skate.jpg" 1728 1152 "STREET SKATE MOTION" "POINT TRACKING: BOARD CENTROID" 0.42 0.6
Create-ShowcaseImage "night-rider.jpg" 1792 1008 "NIGHT MOUNTAIN RIDER" "VIRTUAL CAMERA WITH INERTIAL SHAKE" 0.655 0.5
Create-ShowcaseImage "husky.jpg" 1000 1000 "SIBERIAN HUSKY" "FACE ANCHOR (0.514, 0.52)" 0.514 0.52
Create-ShowcaseImage "camera-rig.jpg" 1792 1008 "STUDIO CINEMA RIG" "OPTICAL SENSOR TARGET" 0.537 0.445

Create-StickerImage "sticker-glasses.png" "SHADES" "#1a1a24"
Create-StickerImage "sticker-chain.png" "CHAIN" "#2c2411"
Create-StickerImage "sticker-hat.png" "CAP" "#162032"
Create-StickerImage "sticker-money.png" "CASH" "#142a18"
Create-StickerImage "sticker-grill.png" "GRILL" "#242010"
Create-StickerImage "sticker-crown.png" "CROWN" "#2a220a"
Create-StickerImage "sticker-fire.png" "FIRE" "#2d160a"
Create-StickerImage "sticker-skull.png" "SKULL" "#1e1e24"

Write-Output "Complete"
