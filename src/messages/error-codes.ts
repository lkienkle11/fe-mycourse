/**
 * Numeric API error codes — 1:1 mirror of BE `errcode_codes.go` + user-facing copy.
 *
 * Domain modules (taxonomy, media, course, instructor) do **not** have separate numeric
 * code ranges on BE. They reuse these shared codes; module-specific pre-submit copy lives
 * under `*.validation.*` namespaces in `en.ts` / `vi.ts`.
 *
 * Typical mapping:
 * - Media upload/delete: 2003–2009, 9010–9018
 * - Taxonomy / course / instructor CRUD: 2001–2002, 2010, 3003–3006
 * - Auth flows: 4001–4012
 */
export const errorCodesEn = {
  "0": "Success",

  // Transport / parsing (1xxx)
  "1001": "The request body is not valid JSON.",

  // Validation (2xxx) — shared across taxonomy, course, instructor, media
  "2001": "Some fields are invalid. Please check and try again.",
  "2002": "A field value is invalid.",
  "2003": "A file exceeds the maximum allowed size (2 GB per file).",
  "2004": "This file type is not allowed for upload.",
  "2005":
    "The combined file size exceeds the maximum allowed total (2 GB per request).",
  "2006": "Too many files in one request (maximum 5).",
  "2007": "At least one file is required.",
  "2008": "Too many items selected for batch delete (maximum 10).",
  "2009": "Duplicate items in the batch delete request.",
  "2010":
    "A certificate in the list duplicates another certificate. Please remove or change the duplicate.",

  // Client / HTTP-shaped (3xxx)
  "3001": "Bad request.",
  "3002": "You are not signed in.",
  "3003": "You do not have permission to do this.",
  "3004": "The requested item was not found.",
  "3005": "This action conflicts with the current state.",
  "3006": "Too many requests. Please wait and try again.",

  // Auth (4xxx)
  "4001": "This email is already registered.",
  "4002": "Invalid email or password.",
  "4003": "Password does not meet requirements.",
  "4004": "Please confirm your email address before signing in.",
  "4005": "Your account has been disabled.",
  "4006": "This confirmation link is invalid or has expired.",
  "4007": "Your session is invalid. Please sign in again.",
  "4008": "Your session has expired. Please sign in again.",
  "4009": "Registration was interrupted. Please sign up again.",
  "4010": "Too many confirmation emails were sent. Please try again later.",
  "4011": "Could not send the confirmation email. Please try again.",
  "4012": "Your account is temporarily banned.",
  "4013": "Google sign-in failed. Please try again.",
  "4014": "Your Google account email is not verified.",
  "4015": "Could not link this social account. Please try again.",
  "4016": "X sign-in failed. Please try again.",
  "4017": "Your X account has no email available for sign-in.",
  "4018": "Sign-in session expired. Please try again.",
  "4019":
    "An account with this email already exists. Sign in with email first.",
  "4020": "Google sign-in is not available. Please try email sign-in.",
  "4021": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "4022": "Could not start X sign-in. Please try again later.",

  // Server (9xxx)
  "9001": "Something went wrong on our side. Please try again.",
  "9998": "Something went wrong on our side. Please try again.",
  "9999": "Something went wrong. Please try again.",

  // Media upstream (90xx)
  "9010": "Media storage is not configured.",
  "9011": "Video streaming is not configured.",
  "9012": "Could not create the video. Please try again.",
  "9013": "Could not upload the video. Please try again.",
  "9014": "Video service returned an invalid response.",
  "9015": "The video was not found.",
  "9016": "Could not load video details.",
  "9017": "Image processing is busy. Please try again shortly.",
  "9018": "Service is temporarily unavailable. Please try again later.",
} as const;

export const errorCodesVi = {
  "0": "Thành công",

  // Transport / parsing (1xxx)
  "1001": "Dữ liệu gửi lên không đúng định dạng JSON.",

  // Validation (2xxx)
  "2001": "Một số trường không hợp lệ. Vui lòng kiểm tra và thử lại.",
  "2002": "Giá trị trường không hợp lệ.",
  "2003": "Tệp vượt quá dung lượng cho phép (tối đa 2 GB mỗi tệp).",
  "2004": "Loại tệp này không được phép tải lên.",
  "2005": "Tổng dung lượng vượt quá giới hạn (tối đa 2 GB mỗi lần gửi).",
  "2006": "Quá nhiều tệp trong một lần gửi (tối đa 5).",
  "2007": "Cần ít nhất một tệp.",
  "2008": "Quá nhiều mục được chọn để xóa hàng loạt (tối đa 10).",
  "2009": "Có mục trùng lặp trong yêu cầu xóa hàng loạt.",
  "2010":
    "Một chứng chỉ trong danh sách bị trùng với chứng chỉ khác. Vui lòng xóa hoặc sửa chứng chỉ trùng.",

  // Client / HTTP-shaped (3xxx)
  "3001": "Yêu cầu không hợp lệ.",
  "3002": "Bạn chưa đăng nhập.",
  "3003": "Bạn không có quyền thực hiện thao tác này.",
  "3004": "Không tìm thấy nội dung yêu cầu.",
  "3005": "Thao tác xung đột với trạng thái hiện tại.",
  "3006": "Quá nhiều yêu cầu. Vui lòng đợi và thử lại.",

  // Auth (4xxx)
  "4001": "Email này đã được đăng ký.",
  "4002": "Email hoặc mật khẩu không đúng.",
  "4003": "Mật khẩu không đáp ứng yêu cầu.",
  "4004": "Vui lòng xác nhận email trước khi đăng nhập.",
  "4005": "Tài khoản của bạn đã bị vô hiệu hóa.",
  "4006": "Liên kết xác nhận không hợp lệ hoặc đã hết hạn.",
  "4007": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "4008": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "4009": "Đăng ký bị gián đoạn. Vui lòng đăng ký lại.",
  "4010": "Đã gửi quá nhiều email xác nhận. Vui lòng thử lại sau.",
  "4011": "Không thể gửi email xác nhận. Vui lòng thử lại.",
  "4012": "Tài khoản của bạn tạm thời bị khóa.",
  "4013": "Đăng nhập Google thất bại. Vui lòng thử lại.",
  "4014": "Email Google của bạn chưa được xác minh.",
  "4015": "Không thể liên kết tài khoản mạng xã hội. Vui lòng thử lại.",
  "4016": "Đăng nhập X thất bại. Vui lòng thử lại.",
  "4017": "Tài khoản X không có email để đăng nhập.",
  "4018": "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.",
  "4019": "Email này đã có tài khoản. Hãy đăng nhập bằng email trước.",
  "4020": "Đăng nhập Google không khả dụng. Vui lòng đăng nhập bằng email.",
  "4021":
    "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup và thử lại.",
  "4022": "Không thể bắt đầu đăng nhập X. Vui lòng thử lại sau.",

  // Server (9xxx)
  "9001": "Đã xảy ra lỗi phía máy chủ. Vui lòng thử lại.",
  "9998": "Đã xảy ra lỗi phía máy chủ. Vui lòng thử lại.",
  "9999": "Đã xảy ra lỗi. Vui lòng thử lại.",

  // Media upstream (90xx)
  "9010": "Kho lưu trữ media chưa được cấu hình.",
  "9011": "Dịch vụ phát video chưa được cấu hình.",
  "9012": "Không thể tạo video. Vui lòng thử lại.",
  "9013": "Không thể tải video lên. Vui lòng thử lại.",
  "9014": "Dịch vụ video trả về phản hồi không hợp lệ.",
  "9015": "Không tìm thấy video.",
  "9016": "Không thể tải thông tin video.",
  "9017": "Hệ thống xử lý ảnh đang bận. Vui lòng thử lại sau.",
  "9018": "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.",
} as const;
