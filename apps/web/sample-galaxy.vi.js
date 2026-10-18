// 內建示範星系（IntentAnalysisResponse v1.0，越南文版）：CLI 無資料或擴充功能離線時使用。
const dims = { D1: "Ranh giới lớp", D2: "Cách thể hiện khác biệt", D3: "Mức độ tùy biến", D4: "Cấu trúc theme" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Quan điểm ngược lại: đẩy ${dims[dim]} về thái cực đối lập`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SAMPLE_GALAXY_VI = {
  schema_version: "1.0",
  core: {
    decision: "Mỗi thương hiệu tự fork component riêng, hay dùng một core chung vận hành theo cấu hình?",
    metric: "Trong 60 ngày: theme mới phát hành trong ≤2 ngày, CSS mỗi theme <50KB",
  },
  quadrants: {
    Q1: { scar: "Component dùng chung nhồi đầy if theo thương hiệu", sacred: "core không rẽ nhánh" },
    Q2: { scar: "Chỉnh tay từng cái trong 100+ theme", sacred: "Để type chặn lỗi" },
    Q3: { scar: "Chép nguyên design system, trừu tượng quá đà", sacred: "Cấu trúc thay thế được" },
    Q4: { scar: "Đã ba lần thấy tùy biến vượt tầm kiểm soát", sacred: "Giữ vững ranh giới" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Tách 3 lớp", "Chia component thành ba lớp: core thuần, view điều phối và leaf cho theme; core không được import theme ID hay route", "Sai nếu trong 14 ngày core xuất hiện logic kiểm tra theme", null),
    N2: node("D2", 0, 1, "Chỉ biến CSS", "Mọi khác biệt giữa các theme chỉ thể hiện bằng CSS custom properties, component và layout không có nhánh nào", "Sai nếu đến theme thứ 3 đã phải sửa component", "Khác biệt layout không thể chỉ dựa vào màu sắc"),
    N3: node("D1", 1, 0, "CSS theo theme", "Lúc chạy chỉ tải đúng một stylesheet của theme hiện tại, không đóng gói mọi theme vào lần hiển thị đầu", "Sai nếu trong 14 ngày CSS của một theme vượt 50KB", null),
    N4: node("D4", 0, 2, "Config có type", "Mỗi theme cung cấp một object cấu hình TypeScript đầy đủ, thiếu bất kỳ trường nào là build thất bại", "Sai nếu theme mới vẫn phải sửa component dùng chung", null),
    N5: node("D3", 2, 0, "Fork mỗi brand", "Mỗi theme sao chép thư mục component rồi tự sửa riêng, các thương hiệu không ảnh hưởng nhau", "Sai nếu từ theme thứ 10 trở đi, sửa một bug phải động vào >10 chỗ", "Sửa một bug phải vá N bản"),
    N6: node("D3", 1, 2, "Canary theme", "Theme mới bật bằng feature flag cho 5% tenant trong một tuần; tỷ lệ lỗi đạt chuẩn mới mở cho tất cả", "Sai nếu tỷ lệ lỗi trong giai đoạn canary vượt 1%", null),
    N7: node("D3", 2, 1, "Thay cả vỏ", "[D2 nền tảng ô tô] Layout như thân xe, thay nguyên khối, còn khung gầm dùng chung là view và core thì giữ nguyên", "Sai nếu thay layout mà phải sửa core", "Tương tác lệch nhau giữa các layout",
      { lateral: { src: "Ô tô: khung gầm dùng chung", dist: 2, drop: "Làm khuôn lại cho từng mẫu xe" } }),
    N8: node("D2", 1, 0, "Slot cố định", "[D3 gạch LEGO] Layout khai báo các slot cố định; theme chỉ được cắm component vào slot, không được sửa cấu trúc ngoài slot", "Sai nếu DOM ngoài slot bị sửa dù chỉ 1 lần", null,
      { lateral: { src: "Đồ chơi: khớp nối LEGO", dist: 3, drop: "Tùy biến DOM tự do" } }),
    N9: node("D4", 2, 0, "Kế thừa diff", "[D4 họ font] Theme chỉ khai báo phần khác với default, các trường còn lại tự động kế thừa", "Sai nếu chuỗi kế thừa sâu quá 3 tầng", null,
      { lateral: { src: "Thiết kế chữ: họ độ đậm", dist: 4, drop: "Mỗi theme sao chép toàn bộ" } }),
    N10: node("D2", 2, 0, "Giới hạn config", "Nếu mỗi yêu cầu tùy biến lại thêm một trường cấu hình, chi phí bảo trì cấu hình chắc chắn sẽ vượt chi phí fork thẳng", "Ngừng thêm trường khi một interface cấu hình vượt 40 trường", "Địa ngục cấu hình",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Chi phí dùng chung vượt chi phí sao chép" } }),
    N11: node("D4", 1, 0, "Không đi tắt", "Nếu bên kinh doanh có thể yêu cầu thẳng việc thêm logic thương hiệu vào component dùng chung, ranh giới chắc chắn sẽ vỡ trong một quý", "Thất bại nếu trong 14 ngày có thêm dù chỉ 1 logic thương hiệu vào component dùng chung", "Đổi ranh giới lấy deadline",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Bị deadline ép thì phá ranh giới lại có lợi" } }),
    N12: node("D3", 0, 1, "Cấm làm lại hết", "Nếu phải chuyển xong cả 70 module rồi mới phát hành, chi phí chìm sẽ khiến đợt refactor dừng giữa chừng", "Dừng nếu trong 14 ngày module đầu tiên chưa được phát hành", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Làm lại tất cả một lượt khiến deadline bị bắt làm con tin" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Cấu hình có type dùng chung và fork component theo thương hiệu chỉ được chọn một" },
    { type: "excludes", from: "N1", to: "N5", why: "Core ba lớp dùng chung và sao chép component cho từng thương hiệu loại trừ nhau" },
    { type: "excludes", from: "N4", to: "N11", why: "Cấu hình có type đã chặn đường lách ngay lúc build, nên rà soát ranh giới thủ công thành một cửa kiểm tra thừa" },
    { type: "excludes", from: "N2", to: "N7", why: "Nếu chỉ đổi biến CSS thì sẽ không thay nguyên khối component layout" },
    { type: "excludes", from: "N2", to: "N10", why: "Biến CSS thuần không có trường cấu hình nào để phình ra, chọn một trong hai" },
    { type: "excludes", from: "N9", to: "N11", why: "Chuỗi kế thừa cho phép ghi đè cục bộ, xung đột với hàng rào bảo vệ không cho lách" },
    { type: "requires", from: "N1", to: "N8", why: "Đã tách ba lớp thì theme phải tùy biến qua slot cố định, nếu không lớp view sẽ bị chọc thủng" },
    { type: "requires", from: "N4", to: "N10", why: "Cấu hình có type phải có giới hạn số trường, nếu không sẽ phình thành địa ngục cấu hình" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Công refactor ban đầu", v: "Bỏ đường fork nhanh", t: "60 ngày dựng khung", l: "Phải viết test toàn vẹn", x: "Không có lối tắt riêng cho thương hiệu" },
      fatal: "N10", thesis: "Ranh giới ba lớp cộng cấu hình có type, thu gọn mỗi theme thành một chiếc lá", title: "Chạy theo cấu hình · 3 lớp",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Hạn chế khác biệt layout", v: "Ít tự do thiết kế", t: "Mỗi tuần một bước nhỏ", l: "Không làm được layout phức tạp", x: "Không tùy biến cấu trúc" },
      fatal: "N12", thesis: "Chỉ dùng biến CSS và kế thừa, đưa theme lên dần qua canary", title: "Chỉ style · kế thừa dần",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Code trùng lặp", v: "Sửa bug ở nhiều chỗ", t: "Phát hành nhanh nhất", l: "Chi phí bảo trì tăng tuyến tính", x: "Bỏ cấu hình có type" },
      fatal: "N11", thesis: "Thay nguyên khối layout, mỗi thương hiệu tự fork phần vỏ", title: "Fork theo brand · chung khung gầm",
    },
  },
  recommend: { key: "alpha", why: "Với 100+ theme, chỉ cách chạy theo cấu hình mới giữ được chi phí bảo trì" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Mọi theme đều kế thừa cùng một theme default", kill: "default hỏng là layout của mọi theme vỡ theo", label: "Phụ thuộc default" },
};
