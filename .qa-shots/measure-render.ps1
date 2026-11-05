Add-Type -AssemblyName System.Drawing

$src = 'C:/Users/HP/Desktop/soufinae/slides1/simple-reader/.qa-shots/slide4-frozen.png'
$bmp = [System.Drawing.Bitmap]::FromFile($src)
$w = $bmp.Width; $h = $bmp.Height
function Hex($c) { '#{0:X2}{1:X2}{2:X2}' -f $c.R, $c.G, $c.B }
Write-Output "frozen render: ${w}x${h}"

function Probe($name, $ix, $iy) {
    $rx = [int]($ix * 0.875); $ry = [int](2 + $iy * 0.875)
    Write-Output ("{0,-26} iframe({1},{2}) -> {3}" -f $name, $ix, $iy, (Hex $bmp.GetPixel($rx, $ry)))
}
Probe 'card question zone'   345 400
Probe 'card between buttons' 345 630
Probe 'prev btn fill'        218 631
Probe 'next btn fill mid'    470 631
Probe 'active dot'           319 679
Probe 'inactive dot'         347 679
Probe 'nav-gap above'        345 590
Probe 'purple blob zone'     345 560
Probe 'card bottom edge'     345 700
$bmp.Dispose()
