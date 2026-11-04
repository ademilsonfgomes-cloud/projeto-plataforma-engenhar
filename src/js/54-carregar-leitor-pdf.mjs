try {
const mainURL=URL.createObjectURL(new Blob([Uint8Array.from(atob("{{base64:vendor/pdfjs/pdf.mjs}}"),c=>c.charCodeAt(0))],{type:'text/javascript'}));
const workerURL=URL.createObjectURL(new Blob([Uint8Array.from(atob("{{base64:vendor/pdfjs/pdf.worker.mjs}}"),c=>c.charCodeAt(0))],{type:'text/javascript'}));
window.pdfjsLib=await import(mainURL);
pdfjsLib.GlobalWorkerOptions.workerSrc=workerURL;window.pdfEmbeddedWorkerURL=workerURL;window.resolvePDFReader(pdfjsLib);
}catch(e){window.rejectPDFReader(e);document.getElementById('planStatus').textContent='Falha ao iniciar o leitor PDF: '+e.message;}