export type MockCompany = {
  id: string;
  name: string;
  description: string;
  location?: string;
  domain?: string;
};

export const MOCK_COMPANIES: MockCompany[] = [
  {
    id: "local:fpt-software",
    name: "FPT Software",
    description: "Công ty phần mềm và dịch vụ IT hàng đầu Việt Nam",
    location: "Hà Nội, Việt Nam",
    domain: "fptsoftware.com",
  },
  {
    id: "local:vng",
    name: "VNG Corporation",
    description: "Công ty internet và game trực tuyến hàng đầu Việt Nam",
    location: "TP. Hồ Chí Minh, Việt Nam",
    domain: "vng.com.vn",
  },
  {
    id: "local:shopee-vn",
    name: "Shopee Việt Nam",
    description: "Nền tảng thương mại điện tử hàng đầu Đông Nam Á",
    location: "TP. Hồ Chí Minh, Việt Nam",
    domain: "shopee.vn",
  },
  {
    id: "local:grab-vn",
    name: "Grab Việt Nam",
    description: "Siêu ứng dụng đặt xe, giao đồ ăn và thanh toán số",
    location: "TP. Hồ Chí Minh, Việt Nam",
    domain: "grab.com",
  },
  {
    id: "local:momo",
    name: "MoMo (M_Service)",
    description: "Ví điện tử và fintech lớn nhất Việt Nam",
    location: "TP. Hồ Chí Minh, Việt Nam",
    domain: "momo.vn",
  },
  {
    id: "local:google",
    name: "Google",
    description: "Công ty công nghệ đa quốc gia, tìm kiếm và dịch vụ đám mây",
    location: "Mountain View, California, Mỹ",
    domain: "google.com",
  },
  {
    id: "local:microsoft",
    name: "Microsoft",
    description: "Tập đoàn phần mềm và điện toán đám mây Azure",
    location: "Redmond, Washington, Mỹ",
    domain: "microsoft.com",
  },
  {
    id: "local:amazon",
    name: "Amazon",
    description: "Tập đoàn thương mại điện tử và điện toán đám mây AWS",
    location: "Seattle, Washington, Mỹ",
    domain: "amazon.com",
  },
];
