from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_report(summary):
    buf=BytesIO(); c=canvas.Canvas(buf,pagesize=letter); y=750
    c.setFont("Helvetica-Bold",18); c.drawString(48,y,"MACHINEPRED AI — Analysis Report"); y-=36
    c.setFont("Helvetica",11)
    for section, data in summary.items():
        c.setFont("Helvetica-Bold",13); c.drawString(48,y,str(section)); y-=18; c.setFont("Helvetica",10)
        lines=str(data).replace("{"," ").replace("}","").split(", ")
        for line in lines:
            if y<60: c.showPage(); y=750; c.setFont("Helvetica",10)
            c.drawString(58,y,line[:105]); y-=14
        y-=8
    c.save(); buf.seek(0); return buf
