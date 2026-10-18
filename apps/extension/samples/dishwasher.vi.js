// 擴充功能生活題示範星系（越南文版）：第一次買洗碗機，要為機器改廚房還是挑放得進現有廚房的（IntentAnalysisResponse v1.0）。
const dims = { D1: "Vị trí đặt máy", D2: "Tiêu chí chọn", D3: "Mức cải tạo", D4: "Sức chứa & bát đĩa" };
const node = (dim, cell, inverse_cell, label, claim, kill, blind, extra = {}) => ({
  dim, cell, inverse_cell, inverse_pos: `Quan điểm ngược lại: đẩy ${dims[dim]} về thái cực đối lập`, claim, kill, blind,
  scores: { i: 1, v: 1, r: 0 }, label, ...extra,
});

export const DISHWASHER_GALAXY_VI = {
  schema_version: "1.0",
  core: {
    decision: "Nên cải tạo bếp cho vừa máy rửa bát, hay chọn máy đặt vừa luôn căn bếp hiện có?",
    metric: "Trong 30 ngày đầu, chạy máy ít nhất 5 lần mỗi tuần và rửa tay không quá 5 phút mỗi ngày",
  },
  quadrants: {
    Q1: { scar: "Mua máy rửa bát rồi vẫn rửa tay", sacred: "Đếm lượng bát đĩa trước" },
    Q2: { scar: "Lắp được nửa chừng mới biết ống quá ngắn", sacred: "Đo trước rồi mới mua" },
    Q3: { scar: "Mua theo danh sách gợi ý trên mạng, về không dùng được", sacred: "Mượn cách làm của ngành khác" },
    Q4: { scar: "Đã thấy ba chiếc máy rửa bát thành giá úp bát", sacred: "Nghĩ cách thất bại trước" },
  },
  nodes: {
    N1: node("D1", 0, 2, "Lắp âm tủ bếp", "Tháo một ô tủ rộng 45 hoặc 60 cm cạnh chậu rửa rồi lắp âm máy vào, không chiếm mặt bếp, không chắn lối đi", "Không hợp nếu chiều rộng, cao hoặc sâu của ô tủ nhỏ hơn kích thước lắp âm ghi trên máy", null),
    N2: node("D2", 0, 1, "Rửa sau mỗi bữa", "Chọn máy có chương trình rửa nhanh dưới 1 tiếng, ăn xong bữa nào chạy bữa đó, không để bát bẩn nằm qua đêm trong chậu", "Không hợp nếu trong 14 ngày có hơn 2 lần rửa nhanh xong bát vẫn còn nhờn", "Rửa nhanh thường không sấy, bát phải tự để ráo"),
    N3: node("D1", 1, 0, "Đặt sát chậu", "Đặt máy cách chậu rửa trong vòng 1 mét, ống xả nối thẳng vào lỗ thoát của chậu, không cần khoan tường hay kéo đường ống mới", "Không hợp nếu ống xả kèm máy không với tới chậu và phải nối thêm", null),
    N4: node("D4", 0, 2, "Đủ cho cả nhà", "Nhà từ 3 người trở lên thì chọn máy từ 12 bộ, nồi chảo và bát đĩa rửa chung một mẻ, không phải chia hai lượt", "Không hợp nếu trong 14 ngày có hơn 2 ngày bát đĩa cộng nồi chảo không xếp vừa một mẻ", null),
    N5: node("D3", 2, 0, "Máy mini để bàn", "Mua máy mini đặt trên mặt bếp, từ 8 bộ trở xuống: không tháo tủ, không sửa đường nước, chuyển nhà mang theo được", "Không hợp nếu trong 14 ngày có hơn 3 ngày phải chạy 2 lần mới rửa hết", "Chiếm mất một khoảng mặt bếp sơ chế"),
    N6: node("D3", 1, 2, "Thử rồi mới âm", "Mua loại vừa đặt độc lập vừa lắp âm được, để cạnh chậu dùng đủ 30 ngày rồi mới quyết có tháo tủ hay không, không mua về là tháo ngay", "Không hợp nếu trong 30 ngày dùng thử máy chắn lối đi hoặc vướng ngăn kéo", null),
    N7: node("D3", 2, 1, "Máy bình nước", "Giống xe cắm trại có bình nước riêng, chọn máy để bàn tự đổ nước bằng tay, không nối vòi, không động đến đường ống", "Không hợp nếu có tuần nào từ 2 lần trở lên quay lại rửa tay vì lười đổ nước", "Đổ nước phiền hơn bạn tưởng",
      { lateral: { src: "Cắm trại: bình nước gắn sẵn", dist: 2, drop: "Nối cố định vào vòi nước" } }),
    N8: node("D2", 1, 0, "Đo đủ rồi đặt", "Như phi công tích từng mục trước khi cất cánh, trước khi đặt hàng đo rộng, sâu, cao, rồi kiểm tra vị trí ổ điện và lỗ thoát nước; thiếu 1 trong 5 mục là không đặt", "Không hợp nếu máy giao tới có bất kỳ mục nào không khớp, không lắp được", null,
      { lateral: { src: "Hàng không: checklist trước bay", dist: 3, drop: "Đặt hàng theo cảm tính" } }),
    N9: node("D4", 2, 0, "Chỉ đồ rửa máy", "Như nhà hàng chỉ dùng bát đĩa chịu được máy rửa, thay hết nồi bát có ghi không dùng được cho máy rửa bát, không để lại món nào phải rửa tay", "Không hợp nếu sau khi thay, trong 14 ngày mỗi ngày vẫn còn hơn 3 món phải rửa tay", null,
      { lateral: { src: "Nhà hàng: bát đĩa chuyên dụng", dist: 4, drop: "Bát đĩa cũ đủ kiểu trong nhà" } }),
    N10: node("D2", 2, 0, "Không chạy vơi", "Nếu bát đĩa chưa được nửa giỏ đã chạy, lượng điện nước gần như lúc đầy giỏ, nên tiền điện nước tính trên mỗi cái bát gấp hơn 2 lần lúc đầy", "Ghi lại lượng bát đĩa 7 ngày trước khi đặt hàng; trung bình dưới 6 bộ mỗi ngày thì đổi sang máy mini", "Chờ đầy giỏ thì bát đĩa bốc mùi",
      { falsifier: { attack: "unit_economics", hits: "A2", wound: "Máy to chạy nửa trống thì không đáng" } }),
    N11: node("D4", 1, 0, "Nồi rửa tay", "Nếu tiện tay nhét cả chảo xào, nồi canh vào, máy mini sẽ không xếp nổi bát đĩa trong một mẻ, rốt cuộc lại quay về rửa tay", "Hủy nếu trong 14 ngày có hơn 2 lần phải chạy mẻ thứ hai vì nhét nồi", "Người nhà chưa chắc làm đúng quy tắc",
      { falsifier: { attack: "dark_incentive", hits: "A3", wound: "Ham tiện mà nhét quá tải máy" } }),
    N12: node("D3", 0, 1, "Giữ nguyên bếp", "Nếu lắp máy rửa bát kéo theo làm lại cả bộ tủ bếp, một khi đã khởi công và trả tiền thì chỉ còn cách cắn răng làm cho xong", "Không khởi công nếu báo giá nhận được trước khi tháo tủ cao hơn 2 lần giá máy", null,
      { falsifier: { attack: "sunk_cost", hits: "A1", wound: "Đã khởi công thì khó rút lui" } }),
  },
  edges: [
    { type: "excludes", from: "N4", to: "N5", why: "Máy từ 12 bộ không đặt lên mặt bếp được, nên chỉ chọn một trong hai với máy mini" },
    { type: "excludes", from: "N1", to: "N5", why: "Máy đã lắp âm tủ thì sẽ không mua thêm máy mini để bàn, chỉ chọn một" },
    { type: "excludes", from: "N4", to: "N11", why: "Mua máy to theo số người là để rửa cả nồi chảo, mâu thuẫn với việc để nồi rửa tay" },
    { type: "excludes", from: "N2", to: "N7", why: "Rửa sau mỗi bữa nghĩa là mỗi ngày phải đổ nước bằng tay ba lần, máy bình nước khó trụ lâu" },
    { type: "excludes", from: "N2", to: "N10", why: "Rửa sau mỗi bữa thường chưa đầy nửa giỏ, mâu thuẫn với quy tắc không chạy khi vơi" },
    { type: "excludes", from: "N9", to: "N11", why: "Đổi nồi bát sang loại rửa máy được là để cho vào máy, mâu thuẫn với việc để nồi rửa tay" },
    { type: "requires", from: "N1", to: "N8", why: "Lắp âm tủ lệch 1 cm là không vừa, nên phải đo kỹ từng mục rồi mới đặt hàng" },
    { type: "requires", from: "N4", to: "N10", why: "Máy to chạy nửa trống vẫn tốn điện nước của cả mẻ, nên phải giữ quy tắc không chạy khi vơi" },
  ],
  archetypes: {
    alpha: {
      include: ["N1", "N3", "N4", "N8", "N10"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Tiền công tháo tủ và lắp đặt", v: "Mất một ô tủ chứa đồ", t: "Chờ thợ đến đo và lắp", l: "Đủ nửa giỏ mới rửa", x: "Bỏ máy mini để bàn" },
      fatal: "N10", thesis: "Đo kỹ ô tủ, lắp âm máy to, đủ nửa giỏ mới chạy", title: "Máy to âm tủ · làm một lần",
    },
    beta: {
      include: ["N2", "N3", "N6", "N9", "N12"], exclude: ["N5"],
      sacrifice: { nodes: ["N5"], p: "Thay nồi bát và điện nước mỗi bữa", v: "Chiếm lối đi lúc dùng thử", t: "Sau 30 ngày mới tháo tủ", l: "Rửa nhanh xong phải để bát ráo", x: "Bỏ máy mini để bàn" },
      fatal: "N12", thesis: "Rửa nhanh sau mỗi bữa, đặt cạnh chậu dùng quen rồi mới tháo tủ", title: "Rửa mỗi bữa · thử rồi mới âm",
    },
    gamma: {
      include: ["N3", "N5", "N7", "N8", "N11"], exclude: ["N1", "N4"],
      sacrifice: { nodes: ["N1", "N4"], p: "Lần nào cũng đổ nước bằng tay", v: "Chiếm một khoảng mặt bếp sơ chế", t: "Ngày nào cũng rửa tay nồi chảo", l: "Sức chứa tối đa 8 bộ", x: "Bỏ lắp âm và máy dung tích lớn" },
      fatal: "N11", thesis: "Máy mini để bàn tự đổ nước, nồi chảo để rửa tay", title: "Máy mini · không đụng ống nước",
    },
  },
  recommend: { key: "alpha", why: "Nhà từ 3 người trở lên, một máy to rửa hết bát đĩa cả ngày trong một mẻ" },
  withheld_kill: { attack: "single_point_failure", hits: "A4", claim: "Bát đĩa cả nhà chỉ trông vào một chiếc máy này, hỏng thì ngoài rửa tay không còn phương án dự phòng", kill: "Hủy nếu báo sửa quá 7 ngày chưa xong và cả nhà quay lại rửa tay", label: "Chỉ 1 máy" },
};
