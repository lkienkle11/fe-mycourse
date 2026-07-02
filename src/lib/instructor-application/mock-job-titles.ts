export type MockJobTitle = {
  id: string;
  label: string;
  description?: string;
};

export const MOCK_JOB_TITLES: MockJobTitle[] = [
  {
    id: "local-frontend-dev",
    label: "Frontend Developer",
    description: "Lập trình giao diện người dùng cho ứng dụng web",
  },
  {
    id: "local-sr-frontend-dev",
    label: "Senior Frontend Developer",
    description:
      "Kỹ sư frontend cao cấp, thiết kế kiến trúc UI và dẫn dắt kỹ thuật",
  },
  {
    id: "local-lead-frontend",
    label: "Lead Frontend Engineer",
    description: "Dẫn dắt nhóm kỹ thuật frontend, định hướng công nghệ",
  },
  {
    id: "local-backend-dev",
    label: "Backend Developer",
    description: "Xây dựng hệ thống server-side, API và cơ sở dữ liệu",
  },
  {
    id: "local-sr-backend",
    label: "Senior Backend Engineer",
    description:
      "Kỹ sư backend cao cấp, tối ưu hóa hệ thống và thiết kế kiến trúc",
  },
  {
    id: "local-fullstack-dev",
    label: "Full-Stack Developer",
    description: "Phát triển cả frontend và backend của ứng dụng web",
  },
  {
    id: "local-software-eng",
    label: "Software Engineer",
    description: "Thiết kế, phát triển và duy trì các hệ thống phần mềm",
  },
  {
    id: "local-ml-eng",
    label: "ML Engineer",
    description:
      "Xây dựng và triển khai các mô hình machine learning vào sản phẩm",
  },
  {
    id: "local-devops-eng",
    label: "DevOps Engineer",
    description: "Tự động hóa CI/CD, quản lý hạ tầng và tối ưu hóa vận hành",
  },
  {
    id: "local-vn-fe",
    label: "Lập trình viên Frontend",
    description: "Phát triển giao diện người dùng cho ứng dụng web",
  },
  {
    id: "local-vn-be",
    label: "Lập trình viên Backend",
    description: "Phát triển hệ thống server-side và xử lý dữ liệu",
  },
  {
    id: "local-vn-sw",
    label: "Kỹ sư phần mềm",
    description: "Phân tích, thiết kế và phát triển hệ thống phần mềm",
  },
];
