/**
 * KHU VƯỜN TÂM SỰ — Máy chủ Google Apps Script
 * Gắn script này vào Google Sheets (Tiện ích mở rộng → Apps Script).
 *
 * Bảng tính có trang "Thư" với các cột:
 *  A Thời gian gửi | B Mã thư (đã băm) | C Chủ đề | D Mong muốn | E Muốn nhận phản hồi
 *  F Email | G Nội dung thư | H Phản hồi | I Ngày phản hồi
 *
 * Người quản lý chỉ cần gõ lời hồi đáp vào cột H. Cột I tự điền ngày.
 * Mã thư KHÔNG lưu dạng gốc, chỉ lưu dạng băm SHA-256 có muối,
 * nên người xem bảng tính cũng không biết mã của người gửi.
 */

var TEN_TRANG = 'Thư';
var TIEU_DE_COT = ['Thời gian gửi', 'Mã thư (đã băm)', 'Chủ đề', 'Mong muốn', 'Muốn nhận phản hồi',
                   'Email', 'Nội dung thư', 'Phản hồi', 'Ngày phản hồi'];
var COT_MA = 2, COT_MUON_PHAN_HOI = 5, COT_PHAN_HOI = 8, COT_NGAY_PHAN_HOI = 9;

var CHU_DE = ['Học tập và đại học', 'Tình bạn và các mối quan hệ', 'Cảm xúc cá nhân',
              'Cuộc sống và sự thay đổi', 'Chủ đề khác'];
var MONG_MUON = ['Mình chỉ muốn chia sẻ, không cần hồi đáp', 'Mình muốn nhận một lời động viên',
                 'Mình muốn nhận một vài gợi ý', 'Mình muốn được giới thiệu nguồn hỗ trợ phù hợp'];

/* Bảng ghim: lời nhắn động viên công khai, chỉ hiện khi cột "Duyệt" = "Có" */
var TEN_TRANG_GHIM = 'Bảng ghim';
var TIEU_DE_GHIM = ['Thời gian gửi', 'Biệt danh', 'Lời nhắn', 'Duyệt'];
var COT_DUYET = 4;
var TRANG_THAI_DUYET = ['Chờ duyệt', 'Có', 'Không'];
var SO_GHIM_HIEN_TOI_DA = 30;
var GIOI_HAN_GHIM_MOI_PHUT = 20;
var GIOI_HAN_XEM_BANG_MOI_PHUT = 300;

var GIOI_HAN_GUI_MOI_PHUT = 20;      // tổng số thư nhận tối đa mỗi phút
var GIOI_HAN_TRA_CUU_MOI_PHUT = 60;  // tổng số lượt tra cứu tối đa mỗi phút
var DO_DAI_THU_TOI_DA = 5000;

/** Chạy hàm này MỘT LẦN sau khi dán code (chọn caiDat → Chạy). */
function caiDat() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TEN_TRANG) || ss.insertSheet(TEN_TRANG);
  sh.getRange(1, 1, 1, TIEU_DE_COT.length).setValues([TIEU_DE_COT]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.setColumnWidth(7, 420);
  sh.setColumnWidth(8, 360);
  sh.getRange('G:H').setWrap(true);
  sh.hideColumns(COT_MA);

  var g = ss.getSheetByName(TEN_TRANG_GHIM) || ss.insertSheet(TEN_TRANG_GHIM);
  g.getRange(1, 1, 1, TIEU_DE_GHIM.length).setValues([TIEU_DE_GHIM]).setFontWeight('bold');
  g.setFrozenRows(1);
  g.setColumnWidth(3, 420);
  g.getRange('C:C').setWrap(true);
  g.getRange(2, COT_DUYET, g.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(TRANG_THAI_DUYET, true).build());

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MUOI')) {
    props.setProperty('MUOI', Utilities.getUuid() + Utilities.getUuid());
  }
}

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
  try {
    if (duLieu.hanhDong === 'gui') return traVe(guiThu(duLieu));
    if (duLieu.hanhDong === 'tracuu') return traVe(traCuu(duLieu));
    if (duLieu.hanhDong === 'ghim') return traVe(ghimLoiNhan(duLieu));
    if (duLieu.hanhDong === 'bangghim') return traVe(xemBangGhim());
    return traVe({ ok: false, loi: 'hanh_dong_khong_hop_le' });
  } catch (loi) {
    console.error(loi);
    return traVe({ ok: false, loi: 'loi_may_chu' });
  }
}

/** Tự điền "Ngày phản hồi" khi người quản lý gõ vào cột Phản hồi. */
function onEdit(e) {
  var r = e.range;
  if (r.getSheet().getName() === TEN_TRANG_GHIM) { CacheService.getScriptCache().remove('bangghim'); return; }
  if (r.getSheet().getName() !== TEN_TRANG || r.getColumn() !== COT_PHAN_HOI || r.getRow() < 2) return;
  var o = r.getSheet().getRange(r.getRow(), COT_NGAY_PHAN_HOI);
  if (String(r.getValue()).trim()) { if (!o.getValue()) o.setValue(new Date()); }
  else o.clearContent();
}

/* ---------------- Xử lý ---------------- */

function guiThu(d) {
  if (d.web) return { ok: true }; // ô bẫy chống máy tự động; người thật không điền ô này

  var noiDung = String(d.noiDung || '').trim();
  var chuDe = String(d.chuDe || '');
  var mongMuon = String(d.mongMuon || '');
  var muonPhanHoi = d.muonPhanHoi === 'Có' ? 'Có' : (d.muonPhanHoi === 'Không' ? 'Không' : '');
  var email = String(d.email || '').trim();
  var ma = chuanHoaMa(d.ma);

  if (!noiDung || noiDung.length > DO_DAI_THU_TOI_DA) return { ok: false, loi: 'noi_dung' };
  if (CHU_DE.indexOf(chuDe) < 0 || MONG_MUON.indexOf(mongMuon) < 0 || !muonPhanHoi) return { ok: false, loi: 'lua_chon' };
  if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) return { ok: false, loi: 'email' };
  if (!maHopLe(ma)) return { ok: false, loi: 'ma_khong_hop_le' };
  if (muonPhanHoi === 'Không') email = '';
  if (vuotGioiHan('gui', GIOI_HAN_GUI_MOI_PHUT)) return { ok: false, loi: 'qua_tai' };

  var khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    var sh = layTrang();
    var maBam = bam(ma);
    if (timDong(sh, maBam) > 0) return { ok: false, loi: 'ma_trung' };
    sh.appendRow([new Date(), maBam, chuDe, mongMuon, muonPhanHoi, antoan(email), antoan(noiDung), '', '']);
  } finally {
    khoa.releaseLock();
  }
  return { ok: true };
}

function traCuu(d) {
  var ma = chuanHoaMa(d.ma);
  if (!/^[A-Z0-9]{10,30}$/.test(ma)) return { ok: true, trangThai: 'khong_tim_thay' };
  if (vuotGioiHan('tracuu', GIOI_HAN_TRA_CUU_MOI_PHUT)) return { ok: false, loi: 'qua_tai' };

  var sh = layTrang();
  var dong = timDong(sh, bam(ma));
  if (dong < 0) return { ok: true, trangThai: 'khong_tim_thay' };

  var hang = sh.getRange(dong, 1, 1, TIEU_DE_COT.length).getValues()[0];
  var phanHoi = String(hang[COT_PHAN_HOI - 1] || '').trim();
  if (phanHoi) {
    var ngay = hang[COT_NGAY_PHAN_HOI - 1];
    return {
      ok: true, trangThai: 'da_phan_hoi', phanHoi: phanHoi,
      ngay: ngay instanceof Date ? Utilities.formatDate(ngay, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') : ''
    };
  }
  return { ok: true, trangThai: hang[COT_MUON_PHAN_HOI - 1] === 'Không' ? 'khong_can_phan_hoi' : 'dang_cho' };
}

function ghimLoiNhan(d) {
  if (d.web) return { ok: true };
  var bietDanh = String(d.bietDanh || '').trim().replace(/\s+/g, ' ');
  var loiNhan = String(d.loiNhan || '').trim().replace(/\s+/g, ' ');
  if (!bietDanhHopLe(bietDanh)) return { ok: false, loi: 'biet_danh' };
  if (loiNhan.length < 5 || loiNhan.length > 200) return { ok: false, loi: 'loi_nhan' };
  if (vuotGioiHan('ghim', GIOI_HAN_GHIM_MOI_PHUT)) return { ok: false, loi: 'qua_tai' };
  var g = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEN_TRANG_GHIM);
  if (!g) throw new Error('Chưa có trang "' + TEN_TRANG_GHIM + '". Hãy chạy hàm caiDat().');
  g.appendRow([new Date(), antoan(bietDanh), antoan(loiNhan), 'Chờ duyệt']);
  return { ok: true };
}

function xemBangGhim() {
  if (vuotGioiHan('xembang', GIOI_HAN_XEM_BANG_MOI_PHUT)) return { ok: false, loi: 'qua_tai' };
  var cache = CacheService.getScriptCache();
  var daLuu = cache.get('bangghim');
  if (daLuu) return JSON.parse(daLuu);
  var g = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEN_TRANG_GHIM);
  var ds = [];
  if (g && g.getLastRow() > 1) {
    var hang = g.getRange(2, 1, g.getLastRow() - 1, TIEU_DE_GHIM.length).getValues();
    for (var i = hang.length - 1; i >= 0 && ds.length < SO_GHIM_HIEN_TOI_DA; i--) {
      if (hang[i][COT_DUYET - 1] !== 'Có') continue;
      ds.push({
        bietDanh: boDauNhay(hang[i][1]),
        loiNhan: boDauNhay(hang[i][2]),
        ngay: hang[i][0] instanceof Date ? Utilities.formatDate(hang[i][0], 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy') : ''
      });
    }
  }
  var kq = { ok: true, loiNhan: ds };
  cache.put('bangghim', JSON.stringify(kq), 60);
  return kq;
}

function bietDanhHopLe(s) {
  return s.length >= 2 && s.length <= 24 && /^[\p{L}\p{N} ]+$/u.test(s) && !/\d{6,}/.test(s);
}

function boDauNhay(s) { s = String(s || ''); return s.charAt(0) === "'" ? s.slice(1) : s; }

/* ---------------- Tiện ích ---------------- */

function chuanHoaMa(ma) { return String(ma || '').trim().toUpperCase(); }

function maHopLe(ma) {
  if (!/^[A-Z0-9]{10,30}$/.test(ma)) return false;
  if (!/[A-Z]/.test(ma) || !/[0-9]/.test(ma)) return false;
  var khac = {};
  for (var i = 0; i < ma.length; i++) khac[ma[i]] = 1;
  return Object.keys(khac).length >= 5;
}

function bam(ma) {
  var muoi = PropertiesService.getScriptProperties().getProperty('MUOI');
  if (!muoi) throw new Error('Chưa chạy hàm caiDat()');
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, muoi + ma, Utilities.Charset.UTF_8);
  return b.map(function (x) { var h = (x & 0xff).toString(16); return h.length === 1 ? '0' + h : h; }).join('');
}

function layTrang() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEN_TRANG);
  if (!sh) throw new Error('Chưa có trang "' + TEN_TRANG + '". Hãy chạy hàm caiDat().');
  return sh;
}

function timDong(sh, maBam) {
  var cuoi = sh.getLastRow();
  if (cuoi < 2) return -1;
  var o = sh.getRange(2, COT_MA, cuoi - 1, 1).createTextFinder(maBam).matchEntireCell(true).findNext();
  return o ? o.getRow() : -1;
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
