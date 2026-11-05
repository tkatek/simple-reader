Add-Type -AssemblyName System.Drawing

# Stitch final light halves: top (2,136,1116x320) + bottom (2,456,1116x308), overlap at viewport 456
$top = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/f-top.png')
$bot = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/f-bottom.png')
$w = 1116
$h = 320 + 308 - 1
$full = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($full)
$g.DrawImage($top, (New-Object System.Drawing.Rectangle(0,0,$w,320)), (New-Object System.Drawing.Rectangle(0,0,$w,320)), [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($bot, (New-Object System.Drawing.Rectangle(0,319,$w,308)), (New-Object System.Drawing.Rectangle(0,0,$w,308)), [System.Drawing.GraphicsUnit]::Pixel)
$full.Save('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/final-light.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $top.Dispose(); $bot.Dispose(); $full.Dispose()
Write-Output "final-light.png ${w}x${h}"

# Dark halves
$t2 = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/f-dark-top.png')
$b2 = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/f-dark-bottom.png')
$w2 = $t2.Width
$h2 = $t2.Height + $b2.Height - 1
$f2 = New-Object System.Drawing.Bitmap($w2, $h2)
$g3 = [System.Drawing.Graphics]::FromImage($f2)
$g3.DrawImage($t2, (New-Object System.Drawing.Rectangle(0,0,$w2,$t2.Height)), (New-Object System.Drawing.Rectangle(0,0,$w2,$t2.Height)), [System.Drawing.GraphicsUnit]::Pixel)
$g3.DrawImage($b2, (New-Object System.Drawing.Rectangle(0,($t2.Height-1),$w2,$b2.Height)), (New-Object System.Drawing.Rectangle(0,0,$w2,$b2.Height)), [System.Drawing.GraphicsUnit]::Pixel)
$f2.Save('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/final-dark.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g3.Dispose(); $t2.Dispose(); $b2.Dispose(); $f2.Dispose()
Write-Output "final-dark.png ${w2}x${h2}"

# Comparison composite: reference (left) vs final light render (right), both 780 wide
$ref = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/.zcode/cli/image-cache/sess_64e6cd60-dadb-4264-a7a5-d2689879ce10/image-924655fc6e0ffbe825399189ae3795fb.png')
$render = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/final-light.png')
$tw = 780
$rh = [int]([Math]::Round(941.0 * $tw / 1672.0))
$eh = [int]([Math]::Round(1.0 * $render.Height * $tw / $render.Width))
$cw = ($tw * 2) + 24
$ch = [Math]::Max($rh, $eh)
$comp = New-Object System.Drawing.Bitmap($cw, $ch)
$g4 = [System.Drawing.Graphics]::FromImage($comp)
$g4.Clear([System.Drawing.Color]::FromArgb(210, 214, 224))
$g4.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g4.DrawImage($ref, (New-Object System.Drawing.Rectangle(0,0,$tw,$rh)), (New-Object System.Drawing.Rectangle(0,0,1672,941)), [System.Drawing.GraphicsUnit]::Pixel)
$g4.DrawImage($render, (New-Object System.Drawing.Rectangle(($tw+24),0,$tw,$eh)), (New-Object System.Drawing.Rectangle(0,0,$render.Width,$render.Height)), [System.Drawing.GraphicsUnit]::Pixel)
$comp.Save('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/final-vs-ref.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g4.Dispose(); $ref.Dispose(); $render.Dispose(); $comp.Dispose()
Write-Output "final-vs-ref.png ${cw}x${ch}"
