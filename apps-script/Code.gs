/**
 * KHU VƯỜN TÂM SỰ — Máy chủ Google Apps Script
 * Gắn script này vào Google Sheets (Tiện ích mở rộng → Apps Script).
 * Sau mỗi lần cập nhật code: chạy lại hàm caiDat() rồi triển khai PHIÊN BẢN MỚI.
 *
 * Trang "Thư":
 *  A Thời gian gửi | B Mã thư (đã băm) | C Chủ đề | D Mong muốn | E Muốn nhận phản hồi
 *  F Email | G Nội dung thư | H Phản hồi | I Ngày phản hồi | J Podcast (đường dẫn)
 *  K Bài hát (đường dẫn) | L Tài khoản | M Cần chú ý
 *
 * Người quản lý gõ lời hồi đáp vào cột H, dán đường dẫn podcast vào J, bài hát vào K.
 * Cột I tự điền ngày. Thư có từ ngữ nguy hiểm được tô đỏ và đánh dấu "Có" ở cột M.
 *
 * Trang "Tài khoản": mật khẩu và mã khôi phục chỉ lưu dạng băm có muối (không đọc ngược được).
 * Mã thư cũng chỉ lưu dạng băm, nên người xem bảng tính không biết mã của người gửi.
 */

/* ---------------- Cấu trúc bảng tính ---------------- */

var TEN_TRANG = 'Thư';
var TIEU_DE_COT = ['Thời gian gửi', 'Mã thư (đã băm)', 'Chủ đề', 'Mong muốn', 'Muốn nhận phản hồi',
                   'Email', 'Nội dung thư', 'Phản hồi', 'Ngày phản hồi', 'Podcast (đường dẫn)',
                   'Bài hát (đường dẫn)', 'Tài khoản', 'Cần chú ý'];
var COT_MA = 2, COT_CHU_DE = 3, COT_MONG_MUON = 4, COT_MUON_PHAN_HOI = 5, COT_NOI_DUNG = 7,
    COT_PHAN_HOI = 8, COT_NGAY_PHAN_HOI = 9, COT_PODCAST = 10, COT_BAI_HAT = 11,
    COT_TAI_KHOAN = 12, COT_CHU_Y = 13;
var MAU_CAN_CHU_Y = '#FAD9D3';

var CHU_DE = ['Học tập và đại học', 'Tình bạn và các mối quan hệ', 'Cảm xúc cá nhân',
              'Cuộc sống và sự thay đổi', 'Chủ đề khác'];
var MONG_MUON = ['Mình chỉ muốn chia sẻ, không cần hồi đáp', 'Mình muốn nhận một lời động viên',
                 'Mình muốn nhận một vài gợi ý', 'Mình muốn được giới thiệu nguồn hỗ trợ phù hợp'];

/* Bảng ghim: lời nhắn động viên công khai, chỉ hiện khi cột "Duyệt" = "Có" */
var TEN_TRANG_GHIM = 'Bảng ghim';
var TIEU_DE_GHIM = ['Thời gian gửi', 'Biệt danh', 'Lời nhắn', 'Duyệt', 'Tài khoản'];
var COT_DUYET = 4, COT_GHIM_TAI_KHOAN = 5;
var TRANG_THAI_DUYET = ['Chờ duyệt', 'Có', 'Không'];
var SO_GHIM_HIEN_TOI_DA = 30;

/* Tài khoản người dùng */
var TEN_TRANG_TK = 'Tài khoản';
var TIEU_DE_TK = ['Ngày tạo', 'ID', 'Tên đăng nhập', 'Biệt danh', 'Muối', 'Mật khẩu (đã băm)',
                  'Mã khôi phục (đã băm)', 'Phiên', 'Lần đăng nhập cuối'];
var TK_ID = 2, TK_TEN = 3, TK_BIET_DANH = 4, TK_MUOI = 5, TK_MAT_KHAU = 6, TK_KHOI_PHUC = 7,
    TK_PHIEN = 8, TK_LAN_CUOI = 9;
var THOI_HAN_PHIEN_NGAY = 30;
var VONG_BAM = 1000;           // số vòng băm mật khẩu (làm chậm việc dò mật khẩu nếu lộ bảng)
var SAI_TOI_DA = 5;            // sai mật khẩu quá số lần này thì tạm khóa
var KHOA_TRONG_GIAY = 15 * 60;

/* Giới hạn tần suất (toàn hệ thống, mỗi phút) */
var GIOI_HAN_GUI_MOI_PHUT = 20;
var GIOI_HAN_TRA_CUU_MOI_PHUT = 60;
var GIOI_HAN_GHIM_MOI_PHUT = 20;
var GIOI_HAN_XEM_BANG_MOI_PHUT = 300;
var GIOI_HAN_DANG_KY_MOI_PHUT = 10;
var GIOI_HAN_DANG_NHAP_MOI_PHUT = 60;
var GIOI_HAN_HOP_THU_MOI_PHUT = 200;
var DO_DAI_THU_TOI_DA = 5000;

/** Chạy hàm này sau khi dán code, và chạy lại mỗi lần cập nhật (chọn caiDat → Chạy). */
function caiDat() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sh = ss.getSheetByName(TEN_TRANG) || ss.insertSheet(TEN_TRANG);
  sh.getRange(1, 1, 1, TIEU_DE_COT.length).setValues([TIEU_DE_COT]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.setColumnWidth(COT_NOI_DUNG, 420);
  sh.setColumnWidth(COT_PHAN_HOI, 360);
  sh.setColumnWidth(COT_PODCAST, 220);
  sh.setColumnWidth(COT_BAI_HAT, 220);
  sh.getRange('G:H').setWrap(true);
  sh.hideColumns(COT_MA);
  if (sh.getMaxRows() > 1) {
    sh.getRange(2, COT_PODCAST, sh.getMaxRows() - 1, 2).setDataValidation(
      SpreadsheetApp.newDataValidation().requireTextIsUrl()
        .setHelpText('Dán đường dẫn https:// tới podcast hoặc bài hát (YouTube, Spotify, SoundCloud...)').build());
  }

  var g = ss.getSheetByName(TEN_TRANG_GHIM) || ss.insertSheet(TEN_TRANG_GHIM);
  g.getRange(1, 1, 1, TIEU_DE_GHIM.length).setValues([TIEU_DE_GHIM]).setFontWeight('bold');
  g.setFrozenRows(1);
  g.setColumnWidth(3, 420);
  g.getRange('C:C').setWrap(true);
  g.getRange(2, COT_DUYET, g.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(TRANG_THAI_DUYET, true).build());

  var tk = ss.getSheetByName(TEN_TRANG_TK) || ss.insertSheet(TEN_TRANG_TK);
  tk.getRange(1, 1, 1, TIEU_DE_TK.length).setValues([TIEU_DE_TK]).setFontWeight('bold');
  tk.setFrozenRows(1);
  tk.getRange('C:D').setNumberFormat('@');
  tk.hideColumns(TK_MUOI, TK_PHIEN - TK_MUOI + 1);

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MUOI')) props.setProperty('MUOI', Utilities.getUuid() + Utilities.getUuid());
  if (!props.getProperty('BI_MAT')) props.setProperty('BI_MAT', Utilities.getUuid() + Utilities.getUuid());
}

/* ---------------- Điểm vào ---------------- */

var HANH_DONG = {
  gui: guiThu, tracuu: traCuu, ghim: ghimLoiNhan, bangghim: xemBangGhim,
  dangky: dangKy, dangnhap: dangNhap, khoiphuc: khoiPhuc, hopthu: xemHopThu,
  catthu: catThu, doibietdanh: doiBietDanh, xoataikhoan: xoaTaiKhoan
};

function doGet() {
  return traVe({ ok: true, dichVu: 'khu-vuon-tam-su' });
}

function doPost(e) {
  var duLieu;
  try {
    duLieu = JSON.parse(e.postData.contents);
  } catch (loi) {
    return traVe({ ok: false, loi: 'du_lieu_khong_hop_le' });
  }
  if (!duLieu || typeof duLieu !== 'object') return traVe({ ok: false, loi: 'du_lieu_khong_hop_le' });
  var ten = String(duLieu.hanhDong || '');
  if (!Object.prototype.hasOwnProperty.call(HANH_DONG, ten)) return traVe({ ok: false, loi: 'hanh_dong_khong_hop_le' });
  try {
    return traVe(HANH_DONG[ten](duLieu));
  } catch (loi) {
    console.error(loi);
    return traVe({ ok: false, loi: 'loi_may_chu' });
  }
}

/** Tự điền "Ngày phản hồi" khi người quản lý gõ hồi đáp, podcast hoặc bài hát (kể cả dán nhiều dòng). */
function onEdit(e) {
  var r = e.range, sh = r.getSheet(), ten = sh.getName();
  if (ten === TEN_TRANG_GHIM) { CacheService.getScriptCache().remove('bangghim'); return; }
  if (ten !== TEN_TRANG) return;
  var c1 = r.getColumn(), c2 = r.getLastColumn();
  var chamPhanHoi = (c1 <= COT_PHAN_HOI && c2 >= COT_PHAN_HOI) || (c1 <= COT_BAI_HAT && c2 >= COT_PODCAST);
  if (!chamPhanHoi) return;
  var d1 = Math.max(2, r.getRow()), d2 = r.getLastRow();
  if (d2 < d1) return;
  var n = d2 - d1 + 1;
  var vung = sh.getRange(d1, COT_PHAN_HOI, n, COT_BAI_HAT - COT_PHAN_HOI + 1).getValues(); // H, I, J, K
  var ngay = vung.map(function (h) {
    var coPhanHoi = [h[0], h[2], h[3]].some(function (v) { return String(v).trim() !== ''; });
    return [coPhanHoi ? (h[1] || new Date()) : ''];
  });
  sh.getRange(d1, COT_NGAY_PHAN_HOI, n, 1).setValues(ngay);
}

/* ---------------- Thư ---------------- */

function guiThu(d) {
  if (d.web) return { ok: true }; // ô bẫy chống máy tự động; người thật không điền ô này

  var noiDung = String(d.noiDung || '').trim();
  var chuDe = String(d.chuDe || '');
  var mongMuon = String(d.mongMuon || '');
  var muonPhanHoi = d.muonPhanHoi === 'Có' ? 'Có' : (d.muonPhanHoi === 'Không' ? 'Không' : '');
  var email = String(d.email || '').trim();
  var ma = chuanHoaMa(d.ma);

  if (!noiDung || noiDung.length > DO_DAI_THU_TOI_DA) return loi('noi_dung');
  if (CHU_DE.indexOf(chuDe) < 0 || MONG_MUON.indexOf(mongMuon) < 0 || !muonPhanHoi) return loi('lua_chon');
  if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) return loi('email');
  if (!maHopLe(ma)) return loi('ma_khong_hop_le');
  if (muonPhanHoi === 'Không') email = '';

  var idTaiKhoan = '';
  if (d.token) {
    var tk = xacThuc(d.token);
    if (!tk) return loi('phien');
    idTaiKhoan = tk.id;
  }
  if (vuotGioiHan('gui', GIOI_HAN_GUI_MOI_PHUT)) return loi('qua_tai');

  var canChuY = !!timNguyCo(noiDung);
  var khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    var sh = layTrang(TEN_TRANG);
    var maBam = bam(ma);
    if (timO(sh, COT_MA, maBam) > 0) return loi('ma_trung');
    sh.appendRow([new Date(), maBam, chuDe, mongMuon, muonPhanHoi, antoan(email), antoan(noiDung),
                  '', '', '', '', idTaiKhoan, canChuY ? 'Có' : '']);
    if (canChuY) sh.getRange(sh.getLastRow(), 1, 1, TIEU_DE_COT.length).setBackground(MAU_CAN_CHU_Y);
  } finally {
    khoa.releaseLock();
  }
  return { ok: true, daCatVaoHop: !!idTaiKhoan };
}

function traCuu(d) {
  var ma = chuanHoaMa(d.ma);
  if (!/^[A-Z0-9]{10,30}$/.test(ma)) return { ok: true, trangThai: 'khong_tim_thay' };
  if (vuotGioiHan('tracuu', GIOI_HAN_TRA_CUU_MOI_PHUT)) return loi('qua_tai');

  var sh = layTrang(TEN_TRANG);
  var dong = timO(sh, COT_MA, bam(ma));
  if (dong < 0) return { ok: true, trangThai: 'khong_tim_thay' };

  var hang = sh.getRange(dong, 1, 1, TIEU_DE_COT.length).getValues()[0];
  var kq = { ok: true };
  var chu = String(hang[COT_TAI_KHOAN - 1] || '');
  if (d.token) {
    var tk = xacThuc(d.token);
    if (tk) { kq.daTrongHop = chu === tk.id; kq.coTheCat = !chu; }
  }
  var tt = thongTinPhanHoi(hang);
  if (tt) {
    kq.trangThai = 'da_phan_hoi';
    kq.phanHoi = tt.phanHoi; kq.ngay = tt.ngay; kq.podcast = tt.podcast; kq.baiHat = tt.baiHat;
  } else {
    kq.trangThai = hang[COT_MUON_PHAN_HOI - 1] === 'Không' ? 'khong_can_phan_hoi' : 'dang_cho';
  }
  return kq;
}

/** Gắn một lá thư gửi ẩn danh trước đây vào hòm thư của tài khoản (cần đúng mã thư). */
function catThu(d) {
  var tk = xacThuc(d.token);
  if (!tk) return loi('phien');
  var ma = chuanHoaMa(d.ma);
  if (!/^[A-Z0-9]{10,30}$/.test(ma)) return loi('khong_tim_thay');
  if (vuotGioiHan('tracuu', GIOI_HAN_TRA_CUU_MOI_PHUT)) return loi('qua_tai');
  var khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    var sh = layTrang(TEN_TRANG);
    var dong = timO(sh, COT_MA, bam(ma));
    if (dong < 0) return loi('khong_tim_thay');
    var o = sh.getRange(dong, COT_TAI_KHOAN);
    var chu = String(o.getValue() || '');
    if (chu === tk.id) return { ok: true, daCo: true };
    if (chu) return loi('khong_tim_thay'); // thư của tài khoản khác: không tiết lộ
    o.setValue(tk.id);
  } finally {
    khoa.releaseLock();
  }
  return { ok: true };
}

/** Nhật ký hòm thư: các thư đã gửi, lời hồi đáp và lời nhắn đã ghim của tài khoản. */
function xemHopThu(d) {
  var tk = xacThuc(d.token);
  if (!tk) return loi('phien');
  if (vuotGioiHan('hopthu', GIOI_HAN_HOP_THU_MOI_PHUT)) return loi('qua_tai');

  var thu = [];
  var sh = layTrang(TEN_TRANG);
  timTatCa(sh, COT_TAI_KHOAN, tk.id).forEach(function (dong) {
    var h = sh.getRange(dong, 1, 1, TIEU_DE_COT.length).getValues()[0];
    var tt = thongTinPhanHoi(h);
    thu.push({
      id: String(h[COT_MA - 1]).slice(0, 16),
      thoiGian: h[0] instanceof Date ? h[0].getTime() : 0,
      ngay: dinhNgay(h[0], 'dd/MM/yyyy HH:mm'),
      chuDe: String(h[COT_CHU_DE - 1] || ''),
      mongMuon: String(h[COT_MONG_MUON - 1] || ''),
      noiDung: boDauNhay(h[COT_NOI_DUNG - 1]),
      canPhanHoi: h[COT_MUON_PHAN_HOI - 1] !== 'Không',
      phanHoi: tt ? tt.phanHoi : '', ngayPhanHoi: tt ? tt.ngay : '',
      podcast: tt ? tt.podcast : '', baiHat: tt ? tt.baiHat : '', daPhanHoi: !!tt
    });
  });
  thu.sort(function (a, b) { return b.thoiGian - a.thoiGian; });

  var ghim = [];
  var g = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEN_TRANG_GHIM);
  if (g) {
    timTatCa(g, COT_GHIM_TAI_KHOAN, tk.id).forEach(function (dong) {
      var h = g.getRange(dong, 1, 1, TIEU_DE_GHIM.length).getValues()[0];
      var duyet = h[COT_DUYET - 1];
      ghim.push({
        thoiGian: h[0] instanceof Date ? h[0].getTime() : 0,
        ngay: dinhNgay(h[0], 'dd/MM/yyyy'),
        loiNhan: boDauNhay(h[2]),
        trangThai: duyet === 'Có' ? 'da_len_bang' : (duyet === 'Không' ? 'khong_duyet' : 'cho_duyet')
      });
    });
    ghim.sort(function (a, b) { return b.thoiGian - a.thoiGian; });
  }
  return { ok: true, taiKhoan: thongTinTaiKhoan(tk.hang), thu: thu.slice(0, 300), ghim: ghim.slice(0, 100) };
}

function thongTinPhanHoi(hang) {
  var phanHoi = String(hang[COT_PHAN_HOI - 1] || '').trim();
  var podcast = lienKetAnToan(hang[COT_PODCAST - 1]);
  var baiHat = lienKetAnToan(hang[COT_BAI_HAT - 1]);
  if (!phanHoi && !podcast && !baiHat) return null;
  return { phanHoi: boDauNhay(phanHoi), ngay: dinhNgay(hang[COT_NGAY_PHAN_HOI - 1], 'dd/MM/yyyy'), podcast: podcast, baiHat: baiHat };
}

/* ---------------- Bảng ghim ---------------- */

function ghimLoiNhan(d) {
  if (d.web) return { ok: true };
  var bietDanh = chuanHoaBietDanh(d.bietDanh);
  var loiNhan = String(d.loiNhan || '').trim().replace(/\s+/g, ' ');
  var idTaiKhoan = '';
  if (d.token) {
    var tk = xacThuc(d.token);
    if (!tk) return loi('phien');
    idTaiKhoan = tk.id;
    bietDanh = boDauNhay(tk.hang[TK_BIET_DANH - 1]);
  }
  if (!bietDanhHopLe(bietDanh)) return loi('biet_danh');
  if (loiNhan.length < 5 || loiNhan.length > 200) return loi('loi_nhan');
  if (timNguyCo(loiNhan)) return loi('nguy_co');
  if (vuotGioiHan('ghim', GIOI_HAN_GHIM_MOI_PHUT)) return loi('qua_tai');
  var g = layTrang(TEN_TRANG_GHIM);
  g.appendRow([new Date(), antoan(bietDanh), antoan(loiNhan), 'Chờ duyệt', idTaiKhoan]);
  return { ok: true };
}

function xemBangGhim() {
  if (vuotGioiHan('xembang', GIOI_HAN_XEM_BANG_MOI_PHUT)) return loi('qua_tai');
  var cache = CacheService.getScriptCache();
  var daLuu = cache.get('bangghim');
  if (daLuu) return JSON.parse(daLuu);
  var g = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEN_TRANG_GHIM);
  var ds = [];
  if (g && g.getLastRow() > 1) {
    var hang = g.getRange(2, 1, g.getLastRow() - 1, 4).getValues();
    for (var i = hang.length - 1; i >= 0 && ds.length < SO_GHIM_HIEN_TOI_DA; i--) {
      if (hang[i][COT_DUYET - 1] !== 'Có') continue;
      ds.push({ bietDanh: boDauNhay(hang[i][1]), loiNhan: boDauNhay(hang[i][2]), ngay: dinhNgay(hang[i][0], 'dd/MM/yyyy') });
    }
  }
  var kq = { ok: true, loiNhan: ds };
  cache.put('bangghim', JSON.stringify(kq), 60);
  return kq;
}

/* ---------------- Tài khoản ---------------- */

function dangKy(d) {
  var ten = chuanHoaTen(d.tenDangNhap), mk = String(d.matKhau || ''), bd = chuanHoaBietDanh(d.bietDanh);
  if (!tenHopLe(ten)) return loi('ten');
  if (!matKhauHopLe(mk, ten)) return loi('mat_khau');
  if (!bietDanhHopLe(bd)) return loi('biet_danh');
  if (vuotGioiHan('dangky', GIOI_HAN_DANG_KY_MOI_PHUT)) return loi('qua_tai');

  var id = 'TK' + Utilities.getUuid().replace(/-/g, '').slice(0, 14).toUpperCase();
  var muoi = Utilities.getUuid();
  var maKhoiPhuc = taoMaKhoiPhuc();
  var khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    var sh = layTrang(TEN_TRANG_TK);
    if (timO(sh, TK_TEN, ten) > 0) return loi('ten_trung');
    sh.appendRow([new Date(), id, ten, antoan(bd), muoi, bamMatKhau(mk, muoi),
                  bamMatKhau(chuanHoaKhoiPhuc(maKhoiPhuc), muoi), 1, new Date()]);
  } finally {
    khoa.releaseLock();
  }
  return { ok: true, token: taoToken(id, 1), taiKhoan: { ten: ten, bietDanh: bd }, maKhoiPhuc: maKhoiPhuc };
}

function dangNhap(d) {
  var ten = chuanHoaTen(d.tenDangNhap), mk = String(d.matKhau || '');
  if (!ten || !mk || mk.length > 200) return loi('sai_thong_tin');
  if (vuotGioiHan('dangnhap', GIOI_HAN_DANG_NHAP_MOI_PHUT)) return loi('qua_tai');
  if (biTamKhoa(ten)) return loi('tam_khoa');

  var sh = layTrang(TEN_TRANG_TK);
  var dong = tenHopLe(ten) ? timO(sh, TK_TEN, ten) : -1;
  var hang = dong > 0 ? sh.getRange(dong, 1, 1, TIEU_DE_TK.length).getValues()[0] : null;
  var dung = hang ? soSanhAnToan(bamMatKhau(mk, String(hang[TK_MUOI - 1])), String(hang[TK_MAT_KHAU - 1]))
                  : (bamMatKhau(mk, 'khong-co-tai-khoan'), false); // vẫn băm để thời gian phản hồi như nhau
  if (!dung) { ghiLanSai(ten); return loi('sai_thong_tin'); }
  xoaLanSai(ten);
  sh.getRange(dong, TK_LAN_CUOI).setValue(new Date());
  return { ok: true, token: taoToken(hang[TK_ID - 1], hang[TK_PHIEN - 1]), taiKhoan: thongTinTaiKhoan(hang) };
}

/** Quên mật khẩu: dùng mã khôi phục để đặt mật khẩu mới. Mọi phiên đăng nhập cũ bị đăng xuất. */
function khoiPhuc(d) {
  var ten = chuanHoaTen(d.tenDangNhap), kp = chuanHoaKhoiPhuc(d.maKhoiPhuc), mkMoi = String(d.matKhauMoi || '');
  if (!matKhauHopLe(mkMoi, ten)) return loi('mat_khau');
  if (!tenHopLe(ten) || kp.length !== 16) return loi('sai_thong_tin');
  if (vuotGioiHan('dangnhap', GIOI_HAN_DANG_NHAP_MOI_PHUT)) return loi('qua_tai');
  if (biTamKhoa(ten)) return loi('tam_khoa');

  var khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    var sh = layTrang(TEN_TRANG_TK);
    var dong = timO(sh, TK_TEN, ten);
    if (dong < 0) { ghiLanSai(ten); return loi('sai_thong_tin'); }
    var hang = sh.getRange(dong, 1, 1, TIEU_DE_TK.length).getValues()[0];
    var muoi = String(hang[TK_MUOI - 1]);
    if (!soSanhAnToan(bamMatKhau(kp, muoi), String(hang[TK_KHOI_PHUC - 1]))) { ghiLanSai(ten); return loi('sai_thong_tin'); }
    xoaLanSai(ten);
    var maMoi = taoMaKhoiPhuc();
    var phien = (Number(hang[TK_PHIEN - 1]) || 1) + 1;
    sh.getRange(dong, TK_MAT_KHAU, 1, 4).setValues([[bamMatKhau(mkMoi, muoi), bamMatKhau(chuanHoaKhoiPhuc(maMoi), muoi), phien, new Date()]]);
    hang[TK_PHIEN - 1] = phien;
  } finally {
    khoa.releaseLock();
  }
  return { ok: true, token: taoToken(hang[TK_ID - 1], phien), taiKhoan: thongTinTaiKhoan(hang), maKhoiPhuc: maMoi };
}

function doiBietDanh(d) {
  var tk = xacThuc(d.token);
  if (!tk) return loi('phien');
  var bd = chuanHoaBietDanh(d.bietDanh);
  if (!bietDanhHopLe(bd)) return loi('biet_danh');
  tk.sh.getRange(tk.dong, TK_BIET_DANH).setValue(antoan(bd));
  return { ok: true, taiKhoan: { ten: String(tk.hang[TK_TEN - 1]), bietDanh: bd } };
}

/** Xóa tài khoản: xóa dòng tài khoản và tách các thư, lời nhắn khỏi tài khoản đó. */
function xoaTaiKhoan(d) {
  var tk = xacThuc(d.token);
  if (!tk) return loi('phien');
  var ten = String(tk.hang[TK_TEN - 1]);
  if (biTamKhoa(ten)) return loi('tam_khoa');
  if (!soSanhAnToan(bamMatKhau(String(d.matKhau || ''), String(tk.hang[TK_MUOI - 1])), String(tk.hang[TK_MAT_KHAU - 1]))) {
    ghiLanSai(ten);
    return loi('sai_thong_tin');
  }
  var khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    var sh = layTrang(TEN_TRANG);
    timTatCa(sh, COT_TAI_KHOAN, tk.id).forEach(function (dong) { sh.getRange(dong, COT_TAI_KHOAN).setValue(''); });
    var g = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEN_TRANG_GHIM);
    if (g) timTatCa(g, COT_GHIM_TAI_KHOAN, tk.id).forEach(function (dong) { g.getRange(dong, COT_GHIM_TAI_KHOAN).setValue(''); });
    var dongTk = timO(tk.sh, TK_ID, tk.id);
    if (dongTk > 0) tk.sh.deleteRow(dongTk);
  } finally {
    khoa.releaseLock();
  }
  return { ok: true };
}

function thongTinTaiKhoan(hang) {
  return { ten: String(hang[TK_TEN - 1]), bietDanh: boDauNhay(hang[TK_BIET_DANH - 1]) };
}

/* Phiên đăng nhập: chuỗi "ID.phiên.hạn.chữ-ký" ký bằng HMAC, không lưu trên máy chủ. */
function taoToken(id, phien) {
  var than = id + '.' + phien + '.' + (Date.now() + THOI_HAN_PHIEN_NGAY * 864e5);
  return than + '.' + kyTen(than);
}

function kyTen(s) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s, layBiMat('BI_MAT'))).replace(/=+$/, '');
}

/** Trả về { id, sh, dong, hang } nếu phiên hợp lệ, ngược lại null. */
function xacThuc(token) {
  var p = String(token || '').split('.');
  if (p.length !== 4 || !/^TK[0-9A-F]{14}$/.test(p[0])) return null;
  if (!soSanhAnToan(kyTen(p.slice(0, 3).join('.')), p[3])) return null;
  if (!(Number(p[2]) > Date.now())) return null;
  var sh = layTrang(TEN_TRANG_TK);
  var dong = timO(sh, TK_ID, p[0]);
  if (dong < 0) return null;
  var hang = sh.getRange(dong, 1, 1, TIEU_DE_TK.length).getValues()[0];
  if (String(hang[TK_PHIEN - 1]) !== p[1]) return null;
  return { id: p[0], sh: sh, dong: dong, hang: hang };
}

function chuanHoaTen(s) { return String(s || '').trim().toLowerCase(); }
function tenHopLe(t) {
  return /^[a-z][a-z0-9_.]{2,23}$/.test(t) && !/\d{6,}/.test(t) && ['true', 'false'].indexOf(t) < 0;
}
function matKhauHopLe(mk, ten) { return mk.length >= 8 && mk.length <= 72 && mk.toLowerCase() !== ten; }
function chuanHoaKhoiPhuc(s) { return String(s || '').toUpperCase().replace(/[^0-9A-F]/g, ''); }

function taoMaKhoiPhuc() {
  var hex = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').toUpperCase();
  var s = hex.slice(0, 8) + hex.slice(40, 48); // tránh các ký tự cố định của UUID v4
  return s.match(/.{4}/g).join('-');
}

function bamMatKhau(mk, muoi) {
  var khoa = Utilities.newBlob(layBiMat('MUOI') + '|' + muoi).getBytes();
  var b = Utilities.computeHmacSha256Signature(Utilities.newBlob(mk).getBytes(), khoa);
  for (var i = 1; i < VONG_BAM; i++) b = Utilities.computeHmacSha256Signature(b, khoa);
  return thapLucPhan(b);
}

function biTamKhoa(ten) { return Number(CacheService.getScriptCache().get('sai_' + ten) || 0) >= SAI_TOI_DA; }
function ghiLanSai(ten) {
  var c = CacheService.getScriptCache(), k = 'sai_' + ten;
  c.put(k, String(Number(c.get(k) || 0) + 1), KHOA_TRONG_GIAY);
}
function xoaLanSai(ten) { CacheService.getScriptCache().remove('sai_' + ten); }

/* ---------------- Từ ngữ nguy hiểm ---------------- */

var MAU_NGUY_CO = [
  /\b(muon|mun|muong) (chet|die|chit)\b/, /\b(khong|ko|k|hok|hong|chang|cha) (muon|mun) song\b/,
  /\btu (sat|lam hai)\b/, /\blam hai (ban )?than\b/, /\bket thuc cuoc (doi|song)\b/, /\bket lieu\b/,
  /\brach (tay|co tay)\b/, /\bnhay (lau|cau)\b/, /\bbien mat mai mai\b/, /\bkhong thiet song\b/,
  /\bchan song\b/, /\bchet (di|quach) cho (roi|xong)\b/, /\btam biet the gioi\b/,
  /\bkhong con ly do (de )?song\b/, /\bkms\b/, /\bunalive\b/
];

/** Trả về cụm từ nguy hiểm đầu tiên (đã bỏ dấu), hoặc '' nếu không có. */
function timNguyCo(s) {
  s = String(s || '');
  var boDau = boDauChu(s);
  for (var i = 0; i < MAU_NGUY_CO.length; i++) {
    var m = MAU_NGUY_CO[i].exec(boDau);
    if (m) return m[0];
  }
  // "tu tu" không dấu trùng với "từ từ", nên chỉ tính khi viết đúng "tự tử" hoặc cả đoạn không có dấu
  if (/tự tử/.test(s.toLowerCase().normalize('NFC')) || (boDau === s.toLowerCase() && /\btu tu\b/.test(boDau))) return 'tu tu';
  return '';
}

function boDauChu(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

/* ---------------- Tiện ích ---------------- */

function loi(ma) { return { ok: false, loi: ma }; }

function chuanHoaBietDanh(s) { return String(s || '').trim().replace(/\s+/g, ' '); }
function bietDanhHopLe(s) {
  return s.length >= 2 && s.length <= 24 && /^[\p{L}\p{N} ]+$/u.test(s) && !/\d{6,}/.test(s);
}

function boDauNhay(s) { s = String(s || ''); return s.charAt(0) === "'" ? s.slice(1) : s; }

function chuanHoaMa(ma) { return String(ma || '').trim().toUpperCase(); }

function maHopLe(ma) {
  if (!/^[A-Z0-9]{10,30}$/.test(ma)) return false;
  if (!/[A-Z]/.test(ma) || !/[0-9]/.test(ma)) return false;
  var khac = {};
  for (var i = 0; i < ma.length; i++) khac[ma[i]] = 1;
  return Object.keys(khac).length >= 5;
}

function bam(ma) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, layBiMat('MUOI') + ma, Utilities.Charset.UTF_8);
  return thapLucPhan(b);
}

function thapLucPhan(b) {
  return b.map(function (x) { var h = (x & 0xff).toString(16); return h.length === 1 ? '0' + h : h; }).join('');
}

function layBiMat(ten) {
  var v = PropertiesService.getScriptProperties().getProperty(ten);
  if (!v) throw new Error('Chưa chạy hàm caiDat()');
  return v;
}

function layTrang(ten) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  if (!sh) throw new Error('Chưa có trang "' + ten + '". Hãy chạy hàm caiDat().');
  return sh;
}

/** Dòng đầu tiên (từ dòng 2) có ô ở cột `cot` đúng bằng `giaTri`, hoặc -1. */
function timO(sh, cot, giaTri) {
  var cuoi = sh.getLastRow();
  if (cuoi < 2 || !giaTri) return -1;
  var o = sh.getRange(2, cot, cuoi - 1, 1).createTextFinder(String(giaTri)).matchEntireCell(true).matchCase(true).findNext();
  return o ? o.getRow() : -1;
}

function timTatCa(sh, cot, giaTri) {
  var cuoi = sh.getLastRow();
  if (cuoi < 2 || !giaTri) return [];
  return sh.getRange(2, cot, cuoi - 1, 1).createTextFinder(String(giaTri)).matchEntireCell(true).matchCase(true)
    .findAll().map(function (o) { return o.getRow(); });
}

function lienKetAnToan(s) {
  s = String(s || '').trim();
  return s.length <= 500 && /^https:\/\/[^\s"'<>\\]+$/i.test(s) ? s : '';
}

function dinhNgay(v, mau) {
  return v instanceof Date ? Utilities.formatDate(v, 'Asia/Ho_Chi_Minh', mau) : '';
}

function soSanhAnToan(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var khac = 0;
  for (var i = 0; i < a.length; i++) khac |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return khac === 0;
}

function vuotGioiHan(loai, gioiHan) {
  var cache = CacheService.getScriptCache();
  var khoaCache = loai + '_' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(khoaCache) || 0) + 1;
  cache.put(khoaCache, String(n), 120);
  return n > gioiHan;
}

/** Chặn chèn công thức vào bảng tính (ô bắt đầu bằng = + - @). */
function antoan(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function traVe(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
