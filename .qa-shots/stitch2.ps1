Add-Type -AssemblyName System.Drawing

$ref = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/.zcode/cli/image-cache/sess_64e6cd60-dadb-4264-a7a5-d2689879ce10/image-924655fc6e0ffbe825399189ae3795fb.png')
$render = [System.Drawing.Bitmap]::FromFile('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/s4-full.png')
$tw = 836
$rh = [int]([Math]::Round(941.0 * $tw / 1672.0))
$eh = [int]([Math]::Round(1.0 * $render.Height * $tw / $render.Width))
$cw = ($tw * 2) + 30
$ch = [Math]::Max($rh, $eh)
$comp = New-Object System.Drawing.Bitmap($cw, $ch)
$g2 = [System.Drawing.Graphics]::FromImage($comp)
$g2.Clear([System.Drawing.Color]::FromArgb(230, 232, 240))
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$r1 = New-Object System.Drawing.Rectangle(0, 0, $tw, $rh)
$s1 = New-Object System.Drawing.Rectangle(0, 0, 1672, 941)
$g2.DrawImage($ref, $r1, $s1, [System.Drawing.GraphicsUnit]::Pixel)
$r2 = New-Object System.Drawing.Rectangle(($tw + 30), 0, $tw, $eh)
$s2 = New-Object System.Drawing.Rectangle(0, 0, $render.Width, $render.Height)
$g2.DrawImage($render, $r2, $s2, [System.Drawing.GraphicsUnit]::Pixel)
$comp.Save('C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/s4-vs-ref.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose(); $ref.Dispose(); $render.Dispose(); $comp.Dispose()
Write-Output "composite s4-vs-ref.png ${cw}x${ch}"
