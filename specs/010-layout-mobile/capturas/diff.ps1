param([string]$DirA, [string]$PrefixA, [string]$DirB, [string]$PrefixB)
# Compara capturas pixel a pixel (spec 010, CS-006)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class Diff {
  public static string Run(string a, string b) {
    var A = new Bitmap(a); var B = new Bitmap(b);
    if (A.Width != B.Width || A.Height != B.Height) return "tamanhos diferentes";
    var r = new Rectangle(0,0,A.Width,A.Height);
    var da = A.LockBits(r, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    var db = B.LockBits(r, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int n = da.Stride*A.Height; var pa = new byte[n]; var pb = new byte[n];
    Marshal.Copy(da.Scan0, pa, 0, n); Marshal.Copy(db.Scan0, pb, 0, n);
    int diff = 0, big = 0, minX=int.MaxValue, minY=int.MaxValue, maxX=-1, maxY=-1;
    for (int y=0;y<A.Height;y++) for (int x=0;x<A.Width;x++) { int i=y*da.Stride+x*4;
      int d = Math.Max(Math.Abs(pa[i]-pb[i]), Math.Max(Math.Abs(pa[i+1]-pb[i+1]), Math.Abs(pa[i+2]-pb[i+2])));
      if (d>0) { diff++; if (d>48) big++; minX=Math.Min(minX,x); minY=Math.Min(minY,y); maxX=Math.Max(maxX,x); maxY=Math.Max(maxY,y);} }
    return diff + " px diferentes (" + big + " com diferença forte)" + (diff>0 ? " em ("+minX+","+minY+")-("+maxX+","+maxY+")" : "");
  }
}
'@
foreach ($w in 1280, 1024, 768, 375) {
  "$w : " + [Diff]::Run((Resolve-Path "$DirA\$PrefixA-$w.png").Path, (Resolve-Path "$DirB\$PrefixB-$w.png").Path)
}
