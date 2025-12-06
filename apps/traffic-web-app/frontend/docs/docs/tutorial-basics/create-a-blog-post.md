---
sidebar_position: 3
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Docusaurus tutorial - Create a blog post.

Module: apps/traffic-web-app/frontend/docs/docs/tutorial-basics/create-a-blog-post.md
Author: UIP Team
Version: 1.0.0
-->

# Create a Blog Post

Docusaurus creates a **page for each blog post**, but also a **blog index page**, a **tag system**, an **RSS** feed...

## Create your first Post

Create a file at `blog/2021-02-28-greetings.md`:

```md title="blog/2021-02-28-greetings.md"
---
slug: greetings
title: Greetings!
authors:
  - name: Nguyễn Nhật Quang
    title: Lead Developer - UIP
    url: https://github.com/NguyenNhatquang522004
    image_url: https://github.com/NguyenNhatquang522004.png
  - name: Nguyễn Việt Hoàng
    title: Full-Stack Developer - UIP
    url: https://github.com/JamesNguyen106
    image_url: https://github.com/JamesNguyen106.png
  - name: Nguyễn Đình Anh Tuấn
    title: Backend Developer - UIP
    url: https://github.com/NguyenDinhAnhTuan04
    image_url: https://github.com/NguyenDinhAnhTuan04.png
tags: [greetings]
---

Congratulations, you have made your first post!

Feel free to play around and edit this post as much as you like.
```

A new blog post is now available at [http://localhost:3000/blog/greetings](http://localhost:3000/blog/greetings).
