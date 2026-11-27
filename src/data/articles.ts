import cobblerStoryImg from '../assets/images/news_cobbler_story_1795758945711.jpg';
import greenRepairImg from '../assets/images/news_green_repair_1795758947609.jpg';
import careTipsImg from '../assets/images/news_care_tips_1795758946822.jpg';
import tailorAlleyImg from '../assets/images/news_tailor_alley_1795758949036.jpg';
import type { Article } from '../types/artisan';

export const DEFAULT_ARTICLE_CATEGORIES: readonly string[] = [
  'Chuyện nghề vỉa hè',
  'Sống xanh & Tái chế',
  'Mẹo giữ đồ bền',
  'Báo chí & Cộng đồng',
] as const;

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-chu-ba-25-nam',
    title: '25 năm ngồi góc ngã tư Bình Thạnh, giữ từng đường chỉ cho đôi giày sinh viên',
    subtitle:
      'Giữa nhịp sống vội vã của Sài Gòn, chiếc ghế đẩu nhỏ và hộp chỉ sáp của Chú Ba vẫn lặng lẽ cứu sống hàng trăm đôi giày mỗi mùa mưa.',
    content:
      '<p>Sáu giờ rưỡi sáng, khi hàng quán quanh khu vực D2 vừa dọn bàn, Chú Ba đã kê ngay ngắn chiếc bàn gỗ sờn màu dưới tán cây xanh. Trên mặt bàn là hơn chục cây dùi đồng, vài cuộn chỉ dù dày và keo dán chuyên dụng đã theo chú qua hơn hai thập kỷ mưu sinh.</p>' +
      '<h2>Đường kim khâu tay bền hơn cả keo nhà máy</h2>' +
      '<p>Nhiều bạn sinh viên mang đến đôi giày thể thao vừa bong đế sau cơn mưa lớn, cứ ngỡ phải bỏ đi mua đôi mới. Chú Ba chỉ cười hiền, xoay nhẹ mũi giày kiểm tra lớp cao su rồi bảo: <em>"Keo cũ nó ngấm nước thì bung thôi, để chú vệ sinh lại, ép keo rồi khâu giấu chỉ quanh viền là đi thêm cả hai năm nữa."</em></p>' +
      '<blockquote>“Mỗi đôi giày sửa xong đi lại êm chân, mấy đứa nhỏ đỡ tốn mấy trăm nghìn mua đôi mới — vậy là chú vui cả ngày rồi.”</blockquote>' +
      '<p>Giá khâu đế chỗ chú nhiều năm nay vẫn giữ ở mức rất nhẹ nhàng cho học sinh, sinh viên. Có bạn mang đôi giày vải đã sờn gót, chú còn tự tay lót thêm miếng da mềm bên trong mà không tính thêm đồng nào.</p>' +
      '<h3>Hẹn nhau ở góc phố quen</h3>' +
      '<p>Chú không dùng mạng xã hội, cũng chẳng có bảng hiệu đèn led rực rỡ. Khách tìm tới chú phần lớn nhờ người này rỉ tai người kia, hoặc tình cờ thấy dấu ghim trên bản đồ Góc Thợ Quanh Ta. Nếu đôi giày yêu thích của bạn đang cần chăm sóc lại trước mùa mưa, hãy ghé ngang góc đường quen của chú nhé.</p>',
    imageUrl: cobblerStoryImg,
    imageCaption: 'Góc bàn gỗ quen thuộc với dùi đồng và chỉ sáp của Chú Ba mỗi sáng tại Bình Thạnh.',
    category: 'Chuyện nghề vỉa hè',
    sourceType: 'original',
    authorName: 'William Gia Minh',
    relatedArtisanId: 'chu-ba-sua-giay',
    isSpotlight: true,
    isFeatured: true,
    isPinned: true,
    status: 'published',
    publishedAt: '24/11/2026',
    createdAt: '2026-11-24T08:00:00Z',
  },
  {
    id: 'art-song-xanh-sua-thay-vi-bo',
    title: 'Vì sao sửa một chiếc balo cũ lại góp phần giảm rác thải đô thị nhiều hơn bạn nghĩ?',
    subtitle:
      'Thay một chiếc dây kéo đồng hay gia cố lại quai đeo chỉ mất 15 phút và 25.000đ, nhưng kéo dài vòng đời món đồ thêm nhiều năm và giảm hàng ký rác thải nhựa dệt.',
    content:
      '<p>Mỗi năm, hàng triệu món đồ cá nhân như balo, túi vải, giày dép và áo khoác bị bỏ đi chỉ vì một lỗi rất nhỏ: kẹt khóa kéo, sứt chỉ quai đeo hoặc tuột nút bấm. Trong khi đó, phần thân vải và phom dáng của món đồ vẫn còn hoàn toàn chắc chắn.</p>' +
      '<h2>3 lợi ích thiết thực khi chọn “sửa trước khi mua mới”</h2>' +
      '<ul>' +
      '<li><strong>Giảm rác thải khó phân hủy:</strong> Đế giày cao su tổng hợp và vải bố pha polyester có thể mất từ 30 đến 50 năm mới phân hủy trong bãi rác.</li>' +
      '<li><strong>Tiết kiệm 70–90% chi phí:</strong> Chi phí sửa chữa tại các góc thợ địa phương thường chỉ bằng một phần rất nhỏ so với giá mua đồ mới.</li>' +
      '<li><strong>Nuôi dưỡng sinh kế vỉa hè bền vững:</strong> Mỗi lần ghé sửa đồ là một lần tiếp thêm thu nhập ổn định cho các cô chú thợ thủ công lớn tuổi quanh khu phố.</li>' +
      '</ul>' +
      '<p>Lần tới khi chiếc balo đi học bỗng dưng hỏng dây kéo, bạn hãy thử mở bản đồ Góc Thợ Quanh Ta tìm bác thợ gần nhà nhất — rất có thể món đồ kỷ niệm của bạn sẽ kịp “hồi sinh” ngay trong buổi chiều.</p>',
    imageUrl: greenRepairImg,
    imageCaption: 'Chiếc balo vải bố và đôi giày da lộn được khâu vá tỉ mỉ để tiếp tục đồng hành thêm nhiều năm.',
    category: 'Sống xanh & Tái chế',
    sourceType: 'original',
    authorName: 'Nhóm biên tập Góc Thợ',
    relatedArtisanId: 'chu-sau-sua-balo',
    isSpotlight: false,
    isFeatured: true,
    isPinned: false,
    status: 'published',
    publishedAt: '21/11/2026',
    createdAt: '2026-11-21T09:30:00Z',
  },
  {
    id: 'art-meo-cham-giay-da-mua-mua',
    title: '5 mẹo giữ giày da & giày vải luôn bền đẹp qua mùa mưa Sài Gòn',
    subtitle:
      'Những thói quen nhỏ sau khi đi mưa về giúp giày không bị bong keo, mốc da hay biến dạng phom — đúc kết từ chia sẻ của chính các chú thợ đóng giày lâu năm.',
    content:
      '<p>Sài Gòn mùa mưa bất chợt là “kẻ thù” số một của giày da và giày sneaker dán keo. Tuy nhiên, nếu xử lý đúng cách ngay trong 2 giờ đầu tiên sau khi về nhà, bạn có thể giữ đôi giày bền đẹp suốt nhiều mùa.</p>' +
      '<ol>' +
      '<li><strong>Tuyệt đối không dùng máy sấy tóc chế độ nóng:</strong> Nhiệt độ cao làm khô cứng bề mặt da và khiến lớp keo ép đế giòn, nhanh bong hơn.</li>' +
      '<li><strong>Nhét giấy báo trắng hoặc cốt gỗ hút ẩm:</strong> Thay giấy 1–2 lần trong tối đầu tiên để hút sạch nước bên trong và giữ phom mũi giày.</li>' +
      '<li><strong>Lau bùn đất ngay khi còn ẩm nhẹ:</strong> Dùng khăn bông mềm ẩm lau sạch vết bẩn trước khi chúng khô cứng và bám sâu vào đường chỉ.</li>' +
      '<li><strong>Dưỡng da bằng sáp ong mỗi tháng một lần:</strong> Một lớp dưỡng mỏng giúp da mềm dẻo, hạn chế nứt gãy nếp gấp mũi chân.</li>' +
      '<li><strong>Khâu gia cố sớm khi thấy mép đế hở nhẹ:</strong> Đừng chờ đế bung hẳn mới mang đi sửa — khâu viền sớm vừa đẹp vừa ít tốn công hơn nhiều.</li>' +
      '</ol>',
    imageUrl: careTipsImg,
    imageCaption: 'Cốt gỗ giữ phom, bàn chải lông mềm và sáp dưỡng giúp giày da bền màu theo năm tháng.',
    category: 'Mẹo giữ đồ bền',
    sourceType: 'original',
    authorName: 'Quang Huy',
    relatedArtisanId: 'chu-nam-giay-tay',
    isSpotlight: false,
    isFeatured: false,
    isPinned: false,
    status: 'published',
    publishedAt: '18/11/2026',
    createdAt: '2026-11-18T14:15:00Z',
  },
  {
    id: 'art-bao-chi-ban-do-tho-via-he',
    title: 'Những tiếng máy may lách cách trong con hẻm nhỏ Sài Gòn và hành trình nối dài nghề cũ',
    subtitle:
      'Góc nhìn báo chí về những người thợ sửa quần áo, sửa khóa, sửa giày thầm lặng giữ nhịp sống tiết kiệm và tình làng nghĩa xóm giữa lòng đô thị hiện đại.',
    content:
      '<p>Trong nhiều con hẻm nhỏ tại Quận 1, Quận 3 hay Bình Thạnh, chiếc máy may đạp chân cũ kỹ vẫn đều đặn vang tiếng lách cách mỗi buổi chiều. Không gian chỉ vỏn vẹn chưa tới hai mét vuông nhưng luôn ấm áp lời thăm hỏi của hàng xóm ghé lên lai quần, thay dây kéo hay vá lại chiếc áo khoác cũ.</p>' +
      '<blockquote>“Nghề sửa đồ vỉa hè không chỉ sửa một vết rách trên vải, mà còn giữ lại thói quen trân trọng đồ đạc và sự gắn kết rất đỗi bình dị của người thành phố.”</blockquote>' +
      '<p>Bài viết tổng hợp những câu chuyện đẹp về cộng đồng thợ thủ công nhỏ lẻ tại TP.HCM và nỗ lực của các bạn trẻ trong việc số hóa địa chỉ tin cậy để thế hệ mới dễ dàng tìm đến và ủng hộ.</p>',
    imageUrl: tailorAlleyImg,
    imageCaption: 'Bàn máy may đạp chân bên hẻm nhỏ — nơi gửi gắm bao chiếc áo quần quen của cư dân quanh khu phố.',
    category: 'Báo chí & Cộng đồng',
    sourceType: 'external_link',
    externalUrl: 'https://tuoitre.vn',
    sourceName: 'Tuổi Trẻ Online',
    authorName: 'Tổng hợp từ Tuổi Trẻ Online',
    relatedArtisanId: 'co-tu-may-va',
    isSpotlight: false,
    isFeatured: false,
    isPinned: false,
    status: 'published',
    publishedAt: '15/11/2026',
    createdAt: '2026-11-15T10:00:00Z',
  },
];
