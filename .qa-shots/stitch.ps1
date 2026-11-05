Add-Type -AssemblyName System.Drawing

# Stitch top (3,135,1114x320) and bottom (3,454,1114x311) into one canvas image
$top = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/s4-top.png')
$bot = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/s4-bottom.png')
$w = 1114
# viewport y 135..765 = 630 rows; top covers 135-455 (320), bottom 454-765 (311); overlap row 454
$h = 320 + 311 - 1
$full = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($full)
$g.DrawImage($top, (New-Object System.Drawing.Rectangle(0,0,$w,320)), (New-Object System.Drawing.Rectangle(0,0,$w,320)), [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($bot, (New-Object System.Drawing.Rectangle(0,319,$w,311)), (New-Object System.Drawing.Rectangle(0,0,$w,311)), [System.Drawing.GraphicsUnit]::Pixel)
$full.Save('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/s4-full.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $top.Dispose(); $bot.Dispose(); $full.Dispose()
Write-Output "stitched s4-full.png ${w}x${h}"

# Side-by-side composite with the reference for visual comparison
$ref = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/.zcode/cli/image-cache/sess_64e6cd60-dadb-4264-a7a5-d2689879ce10/image-924655fc6e0ffbe825399189ae3795fb.png')
$render = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/s4-full.png')
# normalize both to 836 wide
$tw = 836
$rh = [int](941 * $tw / 1672)   # 470
$eh = [int]($render.Height * $tw / $render.Width)
$comp = New-Object System.Drawing.Bitmap($tw * 2 + 30, [Math]::Max($rh, $eh))
$g2 = [System.Drawing.Graphics]::FromImage($comp)
$g2.Clear([System.Drawing.Color]::FromArgb(230, 232, 240))
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($ref, (New-Object System.Drawing.Rectangle(0,0,$tw,$rh)), (New-Object System.Drawing.Rectangle(0,0,1672,941)), [System.Drawing.GraphicsUnit]::Pixel)
$g2.DrawImage($render, (New-Object System.Drawing.Rectangle($tw+30,0,$tw,$eh)), (New-Object System.Drawing.Rectangle(0,0,$render.Width,$render.Height)), [System.Drawing.GraphicsUnit]::Pixel)
$comp.Save('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/s4-vs-ref.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose(); $ref.Dispose(); $render.Dispose(); $comp.Dispose()
Write-Output "composite s4-vs-ref.png (left=reference, right=render)"
