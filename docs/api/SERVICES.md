# API 服务列表和文档 URL

本文档列出了 Vibe Coding Apps 项目中所有配置了 Swagger/OpenAPI 文档的服务。

## HR Management (人力资源管理)

### 1. Attendance Tracker (考勤追踪系统)

- **类型**: Express
- **端口**: 3001
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3001/api-docs
- **JSON URL**: http://localhost:3001/api-docs.json
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/hr-management/attendance-tracker/backend`

**主要功能**:
- 考勤记录管理（签到/签退）
- 考勤统计和报表
- AI 智能分析
- 位置定位

**主要接口**:
- `GET /api/attendance` - 获取考勤记录
- `POST /api/attendance` - 创建考勤记录
- `GET /api/attendance/stats` - 考勤统计

---

### 2. Employee Directory (员工目录)

- **类型**: Express
- **端口**: 3002
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3002/api-docs
- **JSON URL**: http://localhost:3002/api-docs.json
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/hr-management/employee-directory/backend`

**主要功能**:
- 员工信息管理
- 部门管理
- 员工搜索
- 数据导入导出

**主要接口**:
- `GET /api/employees` - 获取员工列表
- `POST /api/employees` - 创建员工
- `GET /api/departments` - 获取部门列表

---

### 3. Leave Management (请假管理)

- **类型**: Express
- **端口**: 3003
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3003/api-docs
- **JSON URL**: http://localhost:3003/api-docs.json
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/hr-management/leave-management/backend`

**主要功能**:
- 请假申请管理
- 假期余额查询
- 请假审批流程
- AI 智能建议

**主要接口**:
- `GET /api/leaves` - 获取请假记录
- `POST /api/leaves` - 创建请假申请
- `PUT /api/leaves/:id/approve` - 审批请假

---

### 4. Payroll Calculator (薪资计算)

- **类型**: Express
- **端口**: 3004
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3004/api-docs
- **JSON URL**: http://localhost:3004/api-docs.json
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/hr-management/payroll-calculator/backend`

**主要功能**:
- 薪资计算
- 工资单生成
- 税务计算
- AI 优化建议

**主要接口**:
- `POST /api/payroll/calculate` - 计算薪资
- `GET /api/payroll/payslips` - 获取工资单
- `POST /api/payroll/export` - 导出薪资数据

---

## Collaboration Tools (协作工具)

### 5. Team Chat (团队聊天)

- **类型**: NestJS
- **端口**: 3001
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3001/api-docs
- **WebSocket**: ws://localhost:3001
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/collaboration-tools/team-chat/backend`

**主要功能**:
- 实时消息传递
- 频道管理
- 文件分享
- AI 智能助手
- 全文搜索

**主要接口**:
- `GET /api/messages` - 获取消息列表
- `POST /api/messages` - 发送消息
- `GET /api/channels` - 获取频道列表
- `POST /api/ai/chat` - AI 助手对话

---

### 6. Video Conference (视频会议)

- **类型**: NestJS
- **端口**: 3002
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3002/api-docs
- **WebSocket**: ws://localhost:3002
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/collaboration-tools/video-conference/backend`

**主要功能**:
- 视频会议管理
- 会议室管理
- 录制和回放
- AI 会议纪要

**主要接口**:
- `POST /api/meetings` - 创建会议
- `GET /api/meetings/:id` - 获取会议详情
- `POST /api/meetings/:id/join` - 加入会议
- `POST /api/ai/summarize` - AI 生成会议纪要

---

### 7. Realtime Docs (实时文档)

- **类型**: NestJS
- **端口**: 3003
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3003/api-docs
- **WebSocket**: ws://localhost:3003
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/collaboration-tools/realtime-docs/backend`

**主要功能**:
- 实时文档编辑
- 协作编辑
- 版本控制
- AI 写作助手

**主要接口**:
- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 创建文档
- `PUT /api/documents/:id` - 更新文档
- `POST /api/ai/suggest` - AI 写作建议

---

### 8. Knowledge Base (知识库)

- **类型**: NestJS
- **端口**: 3004
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3004/api-docs
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/collaboration-tools/knowledge-base/backend`

**主要功能**:
- 知识文章管理
- 全文搜索
- 分类和标签
- AI 智能问答

**主要接口**:
- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建文章
- `GET /api/search` - 搜索文章
- `POST /api/ai/ask` - AI 问答

---

## CRM Systems (客户关系管理)

### 9. Customer Portal (客户门户)

- **类型**: Express/NestJS
- **端口**: 3005
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3005/api-docs
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/crm-systems/customer-portal/server`

**主要功能**:
- 客户信息管理
- 工单系统
- 自助服务
- AI 客服助手

**主要接口**:
- `GET /api/customers` - 获取客户列表
- `POST /api/tickets` - 创建工单
- `GET /api/tickets/:id` - 获取工单详情

---

### 10. Simple CRM (简易 CRM)

- **类型**: Express/NestJS
- **端口**: 3006
- **API 前缀**: `/api`
- **文档 URL**: http://localhost:3006/api-docs
- **服务路径**: `/home/user/Vibe-Coding-Apps/enterprise-apps/crm-systems/simple-crm`

**主要功能**:
- 客户管理
- 销售机会跟踪
- 联系人管理
- 销售报表

**主要接口**:
- `GET /api/customers` - 获取客户列表
- `GET /api/opportunities` - 获取销售机会
- `POST /api/contacts` - 创建联系人

---

## 配置说明

### 开发环境

所有服务在开发环境下默认启用 Swagger 文档。访问 `http://localhost:<port>/api-docs` 即可查看。

### 生产环境

生产环境默认禁用 Swagger 文档以提高安全性。如需启用，请设置环境变量：

```bash
ENABLE_DOCS=true
```

### 环境变量配置

每个服务都支持以下环境变量：

```bash
# 服务端口
PORT=3001

# CORS 配置
CORS_ORIGIN=http://localhost:3000

# 启用文档（生产环境）
ENABLE_DOCS=true

# 数据库连接
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## 批量启动服务

### 启动所有 HR 服务

```bash
# 从项目根目录
cd enterprise-apps/hr-management

# 启动 Attendance Tracker
cd attendance-tracker/backend && npm run dev &

# 启动 Employee Directory
cd employee-directory/backend && npm run dev &

# 启动 Leave Management
cd leave-management/backend && npm run dev &

# 启动 Payroll Calculator
cd payroll-calculator/backend && npm run dev &
```

### 启动所有协作工具服务

```bash
# 从项目根目录
cd enterprise-apps/collaboration-tools

# 启动 Team Chat
cd team-chat/backend && npm run dev &

# 启动 Video Conference
cd video-conference/backend && npm run dev &

# 启动 Realtime Docs
cd realtime-docs/backend && npm run dev &

# 启动 Knowledge Base
cd knowledge-base/backend && npm run dev &
```

## 文档访问汇总

| 服务名称 | 文档 URL | 类型 |
|---------|---------|------|
| Attendance Tracker | http://localhost:3001/api-docs | Express |
| Employee Directory | http://localhost:3002/api-docs | Express |
| Leave Management | http://localhost:3003/api-docs | Express |
| Payroll Calculator | http://localhost:3004/api-docs | Express |
| Team Chat | http://localhost:3001/api-docs | NestJS |
| Video Conference | http://localhost:3002/api-docs | NestJS |
| Realtime Docs | http://localhost:3003/api-docs | NestJS |
| Knowledge Base | http://localhost:3004/api-docs | NestJS |
| Customer Portal | http://localhost:3005/api-docs | Express/NestJS |
| Simple CRM | http://localhost:3006/api-docs | Express/NestJS |

## 技术栈

### Express 服务

- **框架**: Express.js
- **文档工具**: swagger-ui-express, swagger-jsdoc
- **注解方式**: JSDoc 注释

### NestJS 服务

- **框架**: NestJS
- **文档工具**: @nestjs/swagger
- **注解方式**: TypeScript 装饰器

## 相关资源

- [API 文档指南](./README.md)
- [快速开始](./QUICKSTART.md)
- [Express 示例](./examples/express-swagger-example.ts)
- [NestJS 示例](./examples/nestjs-swagger-example.ts)
- [NestJS Controller 示例](./examples/nestjs-controller-example.ts)
- [NestJS DTO 示例](./examples/nestjs-dto-example.ts)
