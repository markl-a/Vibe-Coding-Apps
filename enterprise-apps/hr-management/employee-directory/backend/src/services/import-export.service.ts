import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  imported: any[];
}

/**
 * 批量導入/導出服務
 */
export class ImportExportService {
  /**
   * 從 Excel/CSV 導入員工數據
   */
  async importEmployees(fileBuffer: Buffer, fileType: 'xlsx' | 'csv'): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      imported: [],
    };

    try {
      // 讀取文件
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // 處理每一行數據
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        const rowNumber = i + 2; // Excel 行號從 1 開始，加上標題行

        try {
          // 驗證必填字段
          if (!row.firstName || !row.lastName || !row.email || !row.position) {
            throw new Error('缺少必填字段 (firstName, lastName, email, position)');
          }

          // 檢查郵箱是否已存在
          const existingEmployee = await prisma.employee.findUnique({
            where: { email: row.email },
          });

          if (existingEmployee) {
            throw new Error('郵箱已存在');
          }

          // 生成員工編號
          const employeeNumber = await this.generateEmployeeNumber();

          // 處理日期
          const hireDate = this.parseDate(row.hireDate);
          if (!hireDate) {
            throw new Error('入職日期格式錯誤');
          }

          // 處理技能（假設是逗號分隔的字符串）
          const skills = row.skills
            ? row.skills.split(',').map((s: string) => s.trim())
            : [];

          // 創建員工
          const employee = await prisma.employee.create({
            data: {
              employeeNumber,
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email,
              phone: row.phone || null,
              position: row.position,
              jobTitle: row.jobTitle || row.position,
              employeeType: row.employeeType || 'FULL_TIME',
              hireDate,
              baseSalary: row.baseSalary ? parseFloat(row.baseSalary) : null,
              skills,
              gender: row.gender || null,
              nationality: row.nationality || null,
              address: row.address || null,
              city: row.city || null,
              country: row.country || 'Taiwan',
            },
          });

          result.success++;
          result.imported.push(employee);
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : '未知錯誤',
          });
        }
      }
    } catch (error) {
      throw new Error('文件解析失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }

    return result;
  }

  /**
   * 導出員工數據為 Excel
   */
  async exportEmployees(filters?: {
    departmentId?: string;
    status?: string;
  }): Promise<Buffer> {
    const where: Prisma.EmployeeWhereInput = {};

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.status) {
      where.employmentStatus = filters.status as any;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        manager: true,
      },
      orderBy: { employeeNumber: 'asc' },
    });

    // 準備導出數據
    const exportData = employees.map((emp) => ({
      員工編號: emp.employeeNumber,
      名: emp.firstName,
      姓: emp.lastName,
      郵箱: emp.email,
      電話: emp.phone || '',
      性別: emp.gender || '',
      國籍: emp.nationality || '',
      部門: emp.department?.name || '',
      職位: emp.position,
      職稱: emp.jobTitle,
      員工類型: emp.employeeType,
      在職狀態: emp.employmentStatus,
      入職日期: emp.hireDate.toISOString().split('T')[0],
      基本薪資: emp.baseSalary ? Number(emp.baseSalary) : '',
      幣別: emp.currency,
      主管: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '',
      技能: emp.skills.join(', '),
      地址: emp.address || '',
      城市: emp.city || '',
      國家: emp.country || '',
      創建時間: emp.createdAt.toISOString().split('T')[0],
    }));

    // 創建工作簿
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '員工列表');

    // 設置列寬
    const columnWidths = [
      { wch: 15 }, // 員工編號
      { wch: 10 }, // 名
      { wch: 10 }, // 姓
      { wch: 25 }, // 郵箱
      { wch: 15 }, // 電話
      { wch: 8 },  // 性別
      { wch: 10 }, // 國籍
      { wch: 15 }, // 部門
      { wch: 15 }, // 職位
      { wch: 15 }, // 職稱
      { wch: 12 }, // 員工類型
      { wch: 12 }, // 在職狀態
      { wch: 12 }, // 入職日期
      { wch: 12 }, // 基本薪資
      { wch: 8 },  // 幣別
      { wch: 15 }, // 主管
      { wch: 30 }, // 技能
      { wch: 30 }, // 地址
      { wch: 10 }, // 城市
      { wch: 10 }, // 國家
      { wch: 12 }, // 創建時間
    ];
    worksheet['!cols'] = columnWidths;

    // 生成 Buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * 生成員工編號
   */
  private async generateEmployeeNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.employee.count();
    return `EMP${year}${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * 解析日期
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
      // 嘗試多種日期格式
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }

      // 嘗試 Excel 日期格式（數字）
      if (typeof dateStr === 'number') {
        // Excel 日期從 1900-01-01 開始
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (dateStr - 2) * 86400000);
        return date;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 生成導入模板
   */
  generateTemplate(): Buffer {
    const templateData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+886912345678',
        gender: 'MALE',
        nationality: 'Taiwan',
        position: 'Software Engineer',
        jobTitle: 'Senior Software Engineer',
        employeeType: 'FULL_TIME',
        hireDate: '2024-01-01',
        baseSalary: 60000,
        skills: 'JavaScript, React, Node.js',
        address: '123 Main St',
        city: 'Taipei',
        country: 'Taiwan',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '員工導入模板');

    // 添加說明
    const instructions = [
      ['員工導入模板說明'],
      [''],
      ['必填字段: firstName, lastName, email, position, hireDate'],
      [''],
      ['employeeType 可選值: FULL_TIME, PART_TIME, CONTRACT, INTERN'],
      ['gender 可選值: MALE, FEMALE, OTHER'],
      ['日期格式: YYYY-MM-DD'],
      ['技能請用逗號分隔'],
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionSheet, '說明');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}

export const importExportService = new ImportExportService();
