#!/usr/bin/env python3
"""Re-genera los extractos literales de sources/textos/ desde los consolidados oficiales del BOE.
Uso: python3 descargar-fuentes.py   (requiere 'pdftotext', del paquete poppler).
Tras ejecutarlo, actualizar los SHA-256 en FUENTES.md:  shasum -a 256 textos/*.txt
"""
import re, subprocess, os, urllib.request
UA="Mozilla/5.0 (X11; Linux x86_64) Chrome/124.0 Safari/537.36"
OUT="textos"; os.makedirs(OUT, exist_ok=True)
HDR=re.compile(r'^\s*(Art[íi]culo\s+\d+( bis| ter| qu[aá]ter| quinquies| sexies)?\.?(\s|$)|Disposici[óo]n\s+(final|transitoria|adicional)\b)', re.I)
JUNK=re.compile(r'^\s*(Página\s+\d+|BOLETÍN OFICIAL DEL ESTADO|LEGISLACIÓN CONSOLIDADA|Núm\.\s+\d+.*|cve:\s*BOE.*|ISSN:.*)\s*$')
def dl(url, name):
    req=urllib.request.Request(url, headers={"User-Agent":UA})
    open("/tmp/_"+name,"wb").write(urllib.request.urlopen(req, timeout=60).read())
    subprocess.run(["pdftotext","-layout","/tmp/_"+name,"/tmp/_"+name+".txt"], check=True)
    return open("/tmp/_"+name+".txt",encoding="utf-8",errors="replace").read()
def blocks(txt, arts):
    lines=txt.split("\n"); idxs=[i for i,l in enumerate(lines) if HDR.match(l)]+[len(lines)]; out=[]
    for want in arts:
        pat=re.compile(r'^\s*Art[íi]culo\s+'+re.escape(want)+r'(\.|\s|$)', re.I)
        cands=["\n".join(lines[idxs[k]:idxs[k+1]]).rstrip() for k in range(len(idxs)-1) if pat.match(lines[idxs[k]])]
        if cands:
            seg=max(cands, key=len)
            seg="\n".join(l for l in seg.split("\n") if not JUNK.match(l))
            out.append(re.sub(r'\n{3,}','\n\n',seg))
        else:
            out.append(f"[NO ENCONTRADO: Artículo {want} — revisar en la fuente]")
    return "\n\n".join(out)
JOBS=[
 ("cp-resp-penal-pj.txt","Código Penal (LO 10/1995) — extractos responsabilidad penal de la persona jurídica",
  "https://www.boe.es/buscar/pdf/1995/BOE-A-1995-25444-consolidado.pdf","BOE-A-1995-25444",
  ["31 bis","31 ter","31 quater","31 quinquies","197 quinquies","251 bis","264 quater","288","302","310 bis","427 bis"]),
 ("lgt-facturacion.txt","Ley General Tributaria (Ley 58/2003) — facturación (29.2.j) y sanción (201 bis)",
  "https://www.boe.es/buscar/pdf/2003/BOE-A-2003-23186-consolidado.pdf","BOE-A-2003-23186",["29","201 bis"]),
 ("lopdgdd.txt","LOPDGDD (LO 3/2018) — extractos",
  "https://www.boe.es/buscar/pdf/2018/BOE-A-2018-16673-consolidado.pdf","BOE-A-2018-16673",["7","32","34","72","73","74","78"]),
 ("ley-2-2023-canal.txt","Ley 2/2023 (protección del informante / canal de denuncias) — extractos",
  "https://www.boe.es/buscar/pdf/2023/BOE-A-2023-4513-consolidado.pdf","BOE-A-2023-4513",["7","9","10","65"]),
 ("rd-1007-2023-verifactu.txt","RD 1007/2023 (Veri*Factu) — extractos",
  "https://www.boe.es/buscar/pdf/2023/BOE-A-2023-24840-consolidado.pdf","BOE-A-2023-24840",["9","10","11","12","13","15","16"]),
]
for fn,title,url,idb,arts in JOBS:
    body=blocks(dl(url, fn+".pdf"), arts)
    head=(f"# {title}\n# Fuente oficial: {url}\n# idBOE: {idb} · Descargado: 2026-06-21 · "
          f"Artículos: {', '.join(arts)}\n# Extracto literal del consolidado; ante cualquier duda, abrir la URL.\n\n")
    open(os.path.join(OUT,fn),"w",encoding="utf-8").write(head+body+"\n"); print("OK", fn)
