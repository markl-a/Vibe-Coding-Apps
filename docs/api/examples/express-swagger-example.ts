/**
 * Express Swagger 配置示例
 * 适用于 Attendance Tracker, Employee Directory, Leave Management 等 Express 应用
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupExpressSwagger } from '@vibe/shared-utils';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 基本中间件
app.use(cors());
app.use(express.json());

// 配置 Swagger/OpenAPI 文档
setupExpressSwagger(app, {
  title: 'Attendance Tracker API',
  description: `
# 考勤追踪系统 API

完整的考勤管理 API，支持签到、签退、考勤记录查询、统计报表等功能。

## 功能特性

- 📍 支持位置定位签到
- 📊 实时考勤统计
- 📅 考勤报表导出
- 🤖 AI 智能分析
- 📱 移动端支持

## 认证方式

所有受保护的接口需要在请求头中提供 JWT Token：

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 速率限制

- 未认证用户: 60 请求/小时
- 认证用户: 600 请求/小时
- 管理员: 无限制

## 数据格式

所有请求和响应都使用 JSON 格式。
  `.trim(),
  version: '1.0.0',

  // API 标签分组
  tags: [
    {
      name: 'Attendance',
      description: '考勤记录管理接口',
    },
    {
      name: 'Reports',
      description: '考勤报表和统计接口',
    },
    {
      name: 'AI',
      description: 'AI 智能分析接口',
    },
    {
      name: 'Health',
      description: '健康检查接口',
    },
  ],

  // 服务器配置
  servers: [
    {
      url: 'http://localhost:3001',
      description: '本地开发环境',
    },
    {
      url: 'https://dev-api.vibe-apps.com',
      description: '开发环境',
    },
    {
      url: 'https://staging-api.vibe-apps.com',
      description: '测试环境',
    },
    {
      url: 'https://api.vibe-apps.com',
      description: '生产环境',
    },
  ],

  // 认证配置
  security: {
    bearer: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: `
JWT 认证令牌

### 获取 Token

通过登录接口获取：
\`\`\`
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

### 使用 Token

在请求头中添加：
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`
      `.trim(),
    },
  },

  // 联系信息
  contact: {
    name: 'Vibe Apps API Support',
    email: 'api-support@vibe-apps.com',
    url: 'https://vibe-apps.com/support',
  },

  // 许可证
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },

  // 外部文档
  externalDocs: {
    description: '完整的 API 使用指南和教程',
    url: 'https://docs.vibe-apps.com/api',
  },

  // Swagger UI 配置
  swaggerUiPath: '/api-docs',
  swaggerJsonPath: '/api-docs.json',
  enableSwaggerUI: true,
});

// 示例路由（带 Swagger 注释）
/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: 获取考勤记录列表
 *     description: 根据查询参数获取考勤记录列表，支持分页和过滤
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: 员工ID（可选，用于筛选特定员工）
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（格式：YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（格式：YYYY-MM-DD）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [normal, late, early, absent]
 *         description: 考勤状态
 *     responses:
 *       200:
 *         description: 成功获取考勤记录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AttendanceRecord'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *             examples:
 *               success:
 *                 summary: 成功响应示例
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "att_001"
 *                       employeeId: "emp_123"
 *                       type: "check-in"
 *                       timestamp: "2025-12-21T09:00:00Z"
 *                       location:
 *                         latitude: 22.3193
 *                         longitude: 114.1694
 *                       status: "normal"
 *                     - id: "att_002"
 *                       employeeId: "emp_123"
 *                       type: "check-out"
 *                       timestamp: "2025-12-21T18:00:00Z"
 *                       location:
 *                         latitude: 22.3193
 *                         longitude: 114.1694
 *                       status: "normal"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total: 100
 *                     totalPages: 10
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/attendance', async (req, res) => {
  // 实现逻辑...
  res.json({ success: true, data: [], pagination: {} });
});

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: 创建考勤记录
 *     description: 创建新的考勤记录（签到或签退）
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttendanceDto'
 *           examples:
 *             checkIn:
 *               summary: 签到示例
 *               value:
 *                 employeeId: "emp_123"
 *                 type: "check-in"
 *                 timestamp: "2025-12-21T09:00:00Z"
 *                 location:
 *                   latitude: 22.3193
 *                   longitude: 114.1694
 *                 notes: "正常签到"
 *             checkOut:
 *               summary: 签退示例
 *               value:
 *                 employeeId: "emp_123"
 *                 type: "check-out"
 *                 timestamp: "2025-12-21T18:00:00Z"
 *                 location:
 *                   latitude: 22.3193
 *                   longitude: 114.1694
 *             lateCheckIn:
 *               summary: 迟到签到
 *               value:
 *                 employeeId: "emp_123"
 *                 type: "check-in"
 *                 timestamp: "2025-12-21T10:30:00Z"
 *                 location:
 *                   latitude: 22.3193
 *                   longitude: 114.1694
 *                 notes: "交通延误"
 *     responses:
 *       201:
 *         description: 考勤记录创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AttendanceRecord'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: 未授权访问
 *       409:
 *         description: 数据冲突（如重复签到）
 */
app.post('/api/attendance', async (req, res) => {
  // 实现逻辑...
  res.status(201).json({ success: true, data: {} });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务是否正常运行
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服务正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     AttendanceRecord:
 *       type: object
 *       required:
 *         - id
 *         - employeeId
 *         - type
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: 记录ID
 *           example: "att_001"
 *         employeeId:
 *           type: string
 *           description: 员工ID
 *           example: "emp_123"
 *         type:
 *           type: string
 *           enum: [check-in, check-out]
 *           description: 考勤类型
 *           example: "check-in"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 考勤时间
 *           example: "2025-12-21T09:00:00Z"
 *         location:
 *           type: object
 *           description: 位置信息
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *               description: 纬度
 *               example: 22.3193
 *             longitude:
 *               type: number
 *               format: double
 *               description: 经度
 *               example: 114.1694
 *             address:
 *               type: string
 *               description: 地址
 *               example: "深圳市南山区科技园"
 *         status:
 *           type: string
 *           enum: [normal, late, early, absent]
 *           description: 考勤状态
 *           example: "normal"
 *         notes:
 *           type: string
 *           description: 备注
 *           example: "正常签到"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     CreateAttendanceDto:
 *       type: object
 *       required:
 *         - employeeId
 *         - type
 *         - timestamp
 *       properties:
 *         employeeId:
 *           type: string
 *           description: 员工ID
 *           example: "emp_123"
 *         type:
 *           type: string
 *           enum: [check-in, check-out]
 *           description: 考勤类型
 *           example: "check-in"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 考勤时间
 *           example: "2025-12-21T09:00:00Z"
 *         location:
 *           type: object
 *           description: 位置信息（可选）
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *               description: 纬度
 *             longitude:
 *               type: number
 *               format: double
 *               description: 经度
 *         notes:
 *           type: string
 *           description: 备注（可选）
 *           example: "正常签到"
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: number
 *           example: 500
 *         message:
 *           type: string
 *           example: "服务器内部错误"
 *         error:
 *           type: string
 *           example: "Internal Server Error"
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: number
 *           example: 400
 *         message:
 *           type: string
 *           example: "请求参数验证失败"
 *         error:
 *           type: string
 *           example: "Bad Request"
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "employeeId"
 *               message:
 *                 type: string
 *                 example: "员工ID不能为空"
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// 启动服务器
app.listen(PORT, () => {
  console.log(`🕒 Attendance Tracker Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
  console.log(`📄 Swagger JSON available at http://localhost:${PORT}/api-docs.json`);
});

export default app;
