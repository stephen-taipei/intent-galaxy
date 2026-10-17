// 擴充功能內建生活題示範星系（越南文版）：喜歡又甜又酸的食物，又不想讓身體負擔太大，有哪些吃法？
const dims = { D1: "Cách ăn ngọt", D2: "Cách xả cơn thèm", D3: "Mức thay đổi", D4: "Đồ dự trữ trong nhà" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Quan điểm ngược lại: đẩy ${dims[dim]} về thái cực đối lập`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const SWEET_SOUR_GALAXY_VI = {
  schema_version: "1.0",
  core: {
    decision: "Nên đổi hết đồ ngọt sang trái cây nguyên quả, hay vẫn ăn món mình thích mà chỉ giảm lượng?",
    metric: "Trong 30 ngày, đồ ăn vặt và đồ uống có thêm đường tổng cộng không quá 3 lần mỗi tuần (ghi vào điện thoại để đối chiếu)",
  },
  quadrants: {
    Q1: { scar: "Tưởng trái cây sấy là đồ ăn vặt lành mạnh nên ăn hết cả túi", sacred: "Vị ngọt chỉ đến từ trái cây nguyên quả" },
    Q2: { scar: "Ba lần bỏ đồ ngọt, lần nào cũng gãy ở tuần thứ hai", sacred: "Làm được mới tính" },
    Q3: { scar: "Chép nguyên thực đơn low-carb, ba ngày đã ngán", sacred: "Đổi cách làm, không đổi khẩu vị" },
    Q4: { scar: "Thấy quá nhiều người bỏ đồ ngọt rồi lại ăn lại", sacred: "Quy tắc đáng tin hơn quyết tâm" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Chỉ ăn trái cây", "Mỗi khi thèm ngọt, chỉ ăn trái cây tươi nguyên quả như kiwi, dứa, các loại berry, cam quýt; nước ép, trái cây sấy và mứt đều không tính", "Thất bại nếu trong 14 ngày có hơn 3 ngày mua thêm đồ tráng miệng để đỡ thèm", null),
    N2: node("D2", 0, 1, "Uống soda trước", "Khi thèm, trước tiên uống một ly nước có ga không đường pha chanh hoặc chanh dây; 15 phút sau vẫn muốn ăn thì để dành đến sau bữa kế tiếp. Chỉ đổi đồ uống, ba bữa giữ nguyên, không mua đồ ăn vặt thay thế", "Thất bại nếu trong 14 ngày, uống xong chờ 15 phút mà vẫn thèm ngọt quá nửa số lần", "Đồ uống không giải được cơn thèm nhai gì đó"),
    N3: node("D1", 1, 0, "Chỉ ăn sau bữa", "Đồ ăn vặt chua ngọt và trái cây chỉ ăn trong vòng 1 tiếng sau bữa; bụng đói không ăn, 3 tiếng trước khi ngủ không đụng tới", "Thất bại nếu làm đủ 14 ngày mà vẫn có hơn 3 tối lục tìm đồ ăn vặt trước khi ngủ", null),
    N4: node("D4", 0, 2, "Cấm trữ kẹo", "Mỗi tuần đi chợ một lần: trái cây theo mùa mua cả thùng, sữa chua không đường mua đủ dùng một tuần; đồ ăn vặt trong nhà chỉ có hai thứ này, bánh kẹo có đường không mang về nhà", "Thất bại nếu trong 14 ngày vẫn có một tuần mua đồ ngọt bên ngoài quá 3 lần", null),
    N5: node("D3", 2, 0, "Giảm một nửa", "Đồ ăn vặt chua ngọt vốn thích vẫn ăn, chỉ giảm lượng: chuyển sang gói nhỏ một người, mỗi ngày ăn bằng một nửa trước đây, không đổi sang đồ thay thế", "Thất bại nếu từ tuần 2 trở đi, mỗi tuần có hơn 2 ngày ăn quá nửa lượng cũ", "Ăn hết một gói nhỏ hay bóc thêm gói nữa"),
    N6: node("D3", 1, 2, "Uống thử 3 ngày", "Mỗi lần thử một vị đồ uống không đường mới, mua gói nhỏ nhất uống liền 3 ngày, thích mới mua cả thùng, không mua một lần cho đủ", "Thất bại nếu vị đã mua cả thùng sau khi thử, 14 ngày sau vẫn còn quá nửa", null),
    N7: node("D3", 2, 1, "Đổi nước sốt", "Như thay ốp điện thoại chứ không thay máy: sườn xào chua ngọt, cá sốt chua ngọt vẫn giữ nguyên nguyên liệu chính, nước sốt tự pha bằng cà chua, dứa và giấm, đường chỉ cho một nửa so với trước", "Thất bại nếu trong 14 ngày nấu sốt mới 2 lần mà cả nhà đều chê không ngon", "Ăn ngoài thì không đổi được nước sốt",
      { lateral: { src: "Công nghệ: thay ốp điện thoại", dist: 2, drop: "Bỏ hẳn món đó khỏi thực đơn" } }),
    N8: node("D2", 1, 0, "Tối đa 3 phần", "Như hành lý máy bay có giới hạn cân: mỗi ngày trái cây và đồ ăn vặt chua ngọt cộng lại tối đa 3 phần, mỗi phần cỡ một nắm tay, vượt thì để sang hôm sau, không dựa vào ý chí lúc đó để dừng", "Thất bại nếu trong một tuần có hơn 2 ngày ăn quá 3 phần", null,
      { lateral: { src: "Hàng không: giới hạn hành lý", dist: 3, drop: "Thích thì ăn, không giới hạn" } }),
    N9: node("D4", 2, 0, "Trữ sẵn soda", "Học cửa hàng tiện lợi sắp hết là nhập: tủ lạnh luôn có một thùng nước có ga không đường và một túi chanh, còn 3 lon thì mua thêm thùng, thèm thì không phải ra ngoài mua trà sữa", "Thất bại nếu trong 14 ngày vẫn mua quá 3 ly trà sữa hoặc đồ uống có đường", null,
      { lateral: { src: "Bán lẻ: sắp hết là nhập hàng", dist: 4, drop: "Muốn uống mới chạy đi mua" } }),
    N10: node("D2", 2, 0, "Trần chi tiêu", "Nếu đồ ăn vặt thay thế như trái cây, sữa chua không đường tốn hơn 2 lần tiền ăn vặt mỗi tuần trước đây, chưa tới một tháng sẽ bỏ cuộc và quay lại mua đồ ăn vặt", "Dừng nếu trong 14 ngày tiền đồ thay thế vượt 2 lần tiền ăn vặt trước đây", "Giá trái cây lên xuống nhiều theo mùa",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Đồ thay thế quá đắt nên không trụ lâu" } }),
    N11: node("D4", 1, 0, "Không gom thùng", "Nếu vì freeship hay giá rẻ khi mua số lượng lớn mà mua đồ ăn thức uống cả thùng, đồ trong nhà càng nhiều thì mỗi ngày ăn cũng càng nhiều", "Dừng nếu trong 14 ngày mua cả thùng hoặc gom đơn cho đủ freeship quá 1 lần", "Quà bánh người thân bạn bè tặng thì không kiểm soát được",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Giảm giá khiến càng mua càng nhiều" } }),
    N12: node("D3", 0, 1, "Bắt đầu ngay", "Nếu đợi mua đủ máy làm soda, đường ăn kiêng và đủ loại đồ thay thế rồi mới bắt đầu, số tiền đã bỏ ra sẽ ép bạn cố ăn những thứ không hợp khẩu vị, chưa tới 2 tuần đã bỏ cuộc", "Dừng nếu trong 14 ngày mua quá 1 món dụng cụ hoặc đồ thay thế mà không dùng tới", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Tiếc tiền nên cố ăn cho hết" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Không để bánh kẹo có đường trong nhà và vẫn ăn bánh kẹo có đường như cũ thì chỉ chọn được một" },
    { type: "excludes", from: "N1", to: "N5", why: "Nếu vị ngọt chỉ đến từ trái cây nguyên quả thì không giữ được món ăn vặt có đường vốn thích" },
    { type: "excludes", from: "N4", to: "N11", why: "Trái cây trong nhà dựa vào việc mỗi tuần mua cả thùng; cấm mua cả thùng thì kế hoạch dự trữ này không thành" },
    { type: "excludes", from: "N2", to: "N7", why: "Lối này chỉ đổi đồ uống, ba bữa giữ nguyên, mâu thuẫn với việc tự tay sửa nước sốt chua ngọt" },
    { type: "excludes", from: "N2", to: "N10", why: "Lối này chỉ đổi đồ uống, không mua đồ ăn vặt thay thế; trần chi tiêu cho đồ thay thế thuộc lối khác, chọn một trong hai" },
    { type: "excludes", from: "N9", to: "N11", why: "Trữ sẵn nước có ga phải mua cả thùng, xung đột trực tiếp với việc không gom thùng" },
    { type: "requires", from: "N1", to: "N8", why: "Trái cây cũng có đường; dù chỉ dùng trái cây để đỡ thèm cũng phải giới hạn lượng mỗi ngày, không thì ăn nhiều vẫn hại như thường" },
    { type: "requires", from: "N4", to: "N10", why: "Mỗi tuần mua cả thùng trái cây và sữa chua tốn không ít tiền, phải đặt trần chi tiêu, không thì ví tiền cạn trước" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Cố định đi chợ mỗi tuần một lần", v: "Bỏ món ăn vặt vốn thích", t: "Hai tuần đầu thèm rất khó chịu", l: "Trái cây tối đa 3 phần mỗi ngày", x: "Không được mua tráng miệng ngẫu hứng" },
      fatal: "N10", thesis: "Vị ngọt chỉ từ trái cây nguyên quả và có giới hạn, trong nhà không để bánh kẹo có đường", title: "Chuyển sang trái cây · nhà không đồ ngọt",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Tủ lạnh phải luôn có nước có ga", v: "Thèm thì phải chờ 15 phút trước", t: "Mỗi tuần chỉ đổi một chút", l: "Đường trong ba bữa không giảm", x: "Không ăn món vặt cũ như trước được" },
      fatal: "N12", thesis: "Thèm thì uống nước có ga không đường trước, vị mới thử ít rồi mới mua thêm", title: "Đổi đồ uống trước · giảm từ từ",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Lần nào cũng phải đếm phần", v: "Đồ ngọt trong nhà vẫn cám dỗ", t: "Lâu mới thấy hiệu quả", l: "Giảm lượng hoàn toàn nhờ tự giác", x: "Bỏ việc đổi hẳn sang trái cây" },
      fatal: "N11", thesis: "Món thích vẫn ăn, nhưng đổi gói nhỏ, giới hạn phần và tự pha lại sốt chua ngọt", title: "Vẫn ăn món thích · giới hạn và đổi sốt",
    },
  },
  recommend: { key: "alpha", why: "Trái cây vốn đã chua chua ngọt ngọt, và không để bánh kẹo có đường trong nhà là cách tốn ít ý chí nhất" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Mọi cơn thèm chua ngọt chỉ trông vào một loại trái cây hoặc đồ uống", kill: "Thứ đó hết hàng hoặc ăn ngán là cả kế hoạch sụp đổ", label: "Chỉ một món" },
};
