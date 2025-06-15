// qr-tools.js
import { BrowserQRCodeReader, BrowserQRCodeSvgWriter } from 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.1/+esm';

window.generateQRCode = function () {
  const text = document.getElementById("textToEncode").value.trim();
  if (!text) return alert("⚠️ أدخل نصًا أولاً!");

  const writer = new BrowserQRCodeSvgWriter();
  const svg = writer.write(text, 256, 256);
  const output = document.getElementById("qr-output");
  output.innerHTML = "";
  output.appendChild(svg);
};

window.startQRScanner = async function () {
  const video = document.getElementById("video");
  const output = document.getElementById("output");

  const codeReader = new BrowserQRCodeReader();
  output.textContent = "📡 جاري المسح...";

  try {
    const result = await codeReader.decodeOnceFromVideoDevice(undefined, "video");
    output.textContent = "✅ تم القراءة: " + result.text;
    codeReader.reset();
  } catch (err) {
    output.textContent = "❌ فشل في المسح: " + err;
  }
};
