<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: pof.md
Module: UIP Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Reference document for evaluating open source project sustainability.
============================================================================
-->

Đánh giá khả năng phát triển của một dự án Phần mềm tự do nguồn mở
Thứ hai - 22/04/2013 21:37
     
Tính đến thời điểm này, có tới trên dưới 400,000 dự án phần mềm tự do nguồn mở trên toàn thế giới, và nhiều dự án mới được phát sinh mỗi ngày; từ những dự án thu hút hàng ngàn, hàng chục ngàn, thậm chí hàng trăm ngàn lập trình viên, tới những dự án chỉ với duy nhất 1 người phát triển. Câu hỏi đặt ra là làm thế nào để xác định được tiềm năng phát triển, hướng tới thành công của một dự án PMTDNM (không phân biệt dự án lớn/nhỏ, dự án mới/lâu năm…). Một trong các phương pháp được sử dụng nhiều nhất là phương pháp "Tính chỉ số khả năng một dự án PMTDNM đang trên con đường dẫn tới Thất bại – Points of FAIL".
Đánh giá khả năng phát triển của một dự án Phần mềm tự do nguồn mở
Bài viết này đề cập đến phương pháp này cùng chi tiết về cách tính điểm PoF (Points of FAIL) cho một dự án PMTDNM. PoF càng lớn nghĩa là dự án càng đang tiến gần đến điểm “Chết”.Trên thực tế, mục đích chính của hệ thống tính điểm PoF là chỉ ra các điểm chưa tốt của dự án PMTDNM, khuyến khích mỗi dự án tự điều chỉnh nhằm đi đến mục tiêu thành công cuối cùng. Các thuộc tính được xem xét cho một dự án cùng PoF cho mỗi thuộc tính bao gồm:

Tổng độ lớn mã nguồn (Size):

Nếu độ lớn mã nguồn của dự án >100MB: +5 PoF
Nếu mã nguồn nén lại vẫn có độ lớn >100MB: +5 PoF
Hệ thống quản lý mã nguồn (Source Control):

Không có hệ thống quản lý mã nguồn công khai (VD: cvs, svn, bzr, git, hg…): +10 PoF
Có hệ thống quản lý mã nguồn công khai, nhưng:
không có web viewer: +5 PoF
không có tài liệu hướng dẫn sử dụng cho người mới: +5 PoF
hệ thống quản lý mã nguồn tự tạo: +30 PoF
trên thực tế, không được sử dụng: +50 PoF
Dịch từ mã nguồn (Building From Source):

Không có tài liệu hướng dẫn dịch từ mà nguồn: +20 PoF
Có tài liệu nhưng không chính xác: +10 PoF
Mã nguồn được cấu hình bằng một shell script tự viết bằng tay: +10 PoF
Mã nguồn được cấu hình bằng cách sửa trực tiếp vào tệp cấu hình: +20 PoF
Mã nguồn được cấu hình bằng cách sửa thủ công vào các tệp header: +30 PoF
Mã nguồn không cấu hình được trước khi dịch: +50 PoF
Mã nguồn được dịch bằng công cụ khác, không phải GNU Make: +10 PoF
Mã nguồn được dịch bằng công cụ nguồn đóng: +50 PoF
Mã nguồn được dịch bằng công cụ tự tạo: +100 PoF
Gói kèm (Bundling):

Mã nguồn chỉ phát hành với các dự án khác mà nó phụ thuộc vào: +20 PoF
Mã nguồn không thể dịch riêng nếu không dịch mã gói kèm trước: +10 PoF
Mã gói kèm đã bị chỉnh sửa: +40 PoF
Thư viện (Libraries):

Chương trình chỉ dịch ra thư viện tĩnh (static libraries): +20 PoF
Chương trình có thể dịch ra thư viện chia sẻ (shared libraries) nhưng không đánh phiên bản: +20 PoF
Không cố gắng sử dụng các thư viện hệ thống (system libraries) sẵn có: +20 PoF
Cài đặt hệ thống (System Install):

Chương trình cố gắng cài đặt vào thư mục /opt hoặc /usr/local: +10 PoF
Không có “make install”: +20 PoF
Chương trình không hoạt động ngoài thư mục mã nguồn: +30 PoF
Các “dị điểm” trong mã nguồn (Code Oddities):

Mã nguồn sử dụng dấu xuống dòng kiểu Windows (“DOS format” files): +5 PoF
Mã nguồn phụ thuộc vào một tính năng cụ thể của chương trình dịch: +20 PoF
Mã nguồn phụ thuộc vào một lỗi cụ thể của chương trình dịch: +50 PoF
Mã nguồn phụ thuộc vào bất cứ thứ gì trong bộ Microsoft Visual Studio: +100 PoF
Giao tiếp (Communication):

Dự án không có thông báo phát hành trên nhóm thư (mailing list): +5 PoF
Dự án không có nhóm thư: +10 PoF
Dự án không có trình quản lý lỗi (bug tracker): +20 PoF
Dự án không có website: +50 PoF
Là một dự án ảo (vaporware) trên Sourceforge: +100 PoF
Phát hành (Releases):

Dự án không thực hiện phát hành theo phiên bản tuần tự (Major, Minor): +10 PoF
Dự án không thực hiện phát hành theo phiên bản: +20 PoF
Dự án không có phát hành: +50 PoF
Dự án chỉ phát hành dưới dạng một file gắn kèm một bài viết trên diễn đàn/website: +100 PoF
Bản phát hành chỉ dưới khuôn dạng .zip: +5 PoF
Bản phát hành chỉ dưới khuôn dạng OSX .zip: +10 PoF
Bản phát hành chỉ dưới khuôn dạng .rar: +20 PoF
Bản phát hành chỉ dưới khuôn dạng .arj: +50 PoF
Bản phát hành chỉ dưới khuôn dạng nén tự tạo: +100 PoF
Bản phát hành giải nén không vào thư mục riêng chứa số hiệu phiên bản (e.g. glibc-2.4.2/): +10 PoF
Bản phát hành giải nén không vào thư mục riêng (e.g. glibc/): +25 PoF
Bản phát hành giải nén vào một thư mục con mức sâu (e.g. home/johndoe/glibc-svn/tarball/glibc/src/): +50 PoF
Lịch sử (History):

Chương trình được rẽ nhánh từ một dự án khác: +10 PoF
Các lập trình viên chính không tham gia dự án cha (trong trường hợp rẽ nhánh): +50 PoF
Là phần mềm nguồn đóng trước khi nguồn mở hóa:
1-2 năm: +10 PoF
3-5 năm: +20 PoF
6-10 năm: +30 PoF
trên 10 năm: +50 PoF
Giấy phép (Licensing):

Giấy phép không được ghi trong từng tệp mã: +10 PoF
Mã nguồn tự thân chứa sự không tương thích của các giấy phép: +20 PoF
Mã nguồn không có thông báo về mục đích của giấy phép: +30 PoF
Mã nguồn không bao gồm một bản sao toàn văn giấy phép: +50 PoF
Mã nguồn không nêu rõ giấy phép: +100 PoF
Tài liệu (Documentation):

Chương trình không có lịch sử thay đổi (changelog): +10 PoF
Chương trình không kèm theo bất cứ tài liệu nào: +20 PoF
Không công bố bất cứ tài liệu nào trên website: +30 PoF
Chỉ số tổng hợp (FAIL METER):

0 PoF: Hoàn hảo! Các chỉ số đều hướng tới thành công!
5-25 PoF: Bạn đang làm tốt, nhưng hoàn toàn có thể tốt hơn.
30-60 PoF: Bạn làm chưa tốt. Cần cải tiến.
65-90 PoF: Bạn làm rất không tốt. Cần thay đổi sớm (theo các chỉ số bị cộng điểm cao ở trên).
95-130 PoF: Dự án sắp chìm rồi!
135+ PoF: Dự án đã hoàn toàn thất bại.