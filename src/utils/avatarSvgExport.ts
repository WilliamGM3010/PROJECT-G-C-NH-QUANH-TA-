import { getStudioBackgroundById } from '../data/avatarCatalog';

/**
 * Serialize một thẻ <svg> tĩnh (disableAnimation={true}) sang Blob URL an toàn
 * với inline xmlns & style rõ ràng để vẽ lên HTML5 Canvas độ phân giải cao không mất màu.
 */
export async function svgElementToImage(
  svgElement: SVGSVGElement
): Promise<HTMLImageElement> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', '800');
  clone.setAttribute('height', '960');

  // Bỏ mọi class animation để đảm bảo bản xuất luôn đứng cân đối chính giữa
  clone.querySelectorAll('*').forEach((el) => {
    if (el.hasAttribute('class')) {
      el.removeAttribute('class');
    }
  });

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Tạo ảnh đại diện vuông thu gọn (256x256 PNG) dùng lưu `snapshot_data_url`
 * hiển thị sắc nét trong vòng tròn tài khoản trên Header.
 */
export async function captureCompactAvatarSnapshot(
  svgElement: SVGSVGElement,
  studioBgId: string
): Promise<string | null> {
  try {
    const bg = getStudioBackgroundById(studioBgId);
    const img = await svgElementToImage(svgElement);
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, bg.canvasStops[0]);
    grad.addColorStop(1, bg.canvasStops[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Zoom nhẹ vào khuôn mặt & phần thân trên để nhận diện rõ khi thu nhỏ trên Header
    const drawW = size * 1.18;
    const drawH = drawW * (480 / 400);
    const drawX = (size - drawW) / 2;
    const drawY = -size * 0.06;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
