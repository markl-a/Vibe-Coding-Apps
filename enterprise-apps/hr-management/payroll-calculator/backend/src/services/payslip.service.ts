import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/**
 * 薪資單生成服務
 */
export class PayslipService {
  private uploadsDir = join(process.cwd(), 'uploads', 'payslips');

  constructor() {
    // 確保上傳目錄存在
    try {
      mkdirSync(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create payslips directory:', error);
    }
  }

  /**
   * 生成薪資單 PDF
   */
  async generatePayslip(payrollId: string): Promise<string> {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    // 生成文件名
    const filename = `payslip_${payroll.employeeId}_${payroll.period}.pdf`;
    const filepath = join(this.uploadsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = createWriteStream(filepath);

        doc.pipe(stream);

        // 標題
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('薪資單 Payslip', { align: 'center' })
          .moveDown();

        // 基本資訊
        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`員工編號: ${payroll.employeeId}`)
          .text(`薪資期間: ${payroll.period}`)
          .text(`幣別: ${payroll.currency}`)
          .text(`生成日期: ${new Date().toLocaleDateString('zh-TW')}`)
          .moveDown();

        // 分隔線
        doc
          .strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown();

        // 收入項目
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#333333')
          .text('收入項目', { underline: true })
          .moveDown(0.5);

        doc.fontSize(11).font('Helvetica');

        const earnings = [
          { label: '基本薪資', value: Number(payroll.baseSalary) },
          { label: '獎金', value: Number(payroll.bonus) },
          { label: '加班費', value: Number(payroll.overtimePay) },
          { label: '績效獎金', value: Number(payroll.commission) },
        ];

        let y = doc.y;
        earnings.forEach((item) => {
          if (item.value > 0) {
            doc.text(item.label, 70, y);
            doc.text(
              `NT$ ${item.value.toLocaleString('zh-TW', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`,
              400,
              y,
              { align: 'right', width: 145 }
            );
            y = doc.y;
          }
        });

        // 津貼
        try {
          const allowances = JSON.parse(payroll.allowances as string);
          if (Array.isArray(allowances) && allowances.length > 0) {
            allowances.forEach((allowance: any) => {
              doc.text(allowance.type, 70, y);
              doc.text(
                `NT$ ${Number(allowance.amount).toLocaleString('zh-TW')}`,
                400,
                y,
                { align: 'right', width: 145 }
              );
              y = doc.y;
            });
          }
        } catch (error) {
          console.error('Failed to parse allowances:', error);
        }

        doc.moveDown();

        // 總收入
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#006600')
          .text('總收入', 70)
          .text(
            `NT$ ${Number(payroll.totalEarnings).toLocaleString('zh-TW', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`,
            400,
            doc.y - 14,
            { align: 'right', width: 145 }
          )
          .moveDown(1.5);

        // 分隔線
        doc
          .strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown();

        // 扣除項目
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#333333')
          .text('扣除項目', { underline: true })
          .moveDown(0.5);

        doc.fontSize(11).font('Helvetica');

        y = doc.y;
        const deductions = [
          { label: '個人所得稅', value: Number(payroll.tax) },
          { label: '社會保險', value: Number(payroll.socialInsurance) },
          { label: '住房公積金', value: Number(payroll.housingFund) },
        ];

        deductions.forEach((item) => {
          if (item.value > 0) {
            doc.text(item.label, 70, y);
            doc.text(
              `NT$ ${item.value.toLocaleString('zh-TW', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`,
              400,
              y,
              { align: 'right', width: 145 }
            );
            y = doc.y;
          }
        });

        // 其他扣款
        try {
          const otherDeductions = JSON.parse(payroll.deductions as string);
          if (Array.isArray(otherDeductions) && otherDeductions.length > 0) {
            otherDeductions.forEach((deduction: any) => {
              doc.text(deduction.type, 70, y);
              doc.text(
                `NT$ ${Number(deduction.amount).toLocaleString('zh-TW')}`,
                400,
                y,
                { align: 'right', width: 145 }
              );
              y = doc.y;
            });
          }
        } catch (error) {
          console.error('Failed to parse deductions:', error);
        }

        doc.moveDown();

        // 總扣除
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#990000')
          .text('總扣除', 70)
          .text(
            `NT$ ${Number(payroll.totalDeductions).toLocaleString('zh-TW', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`,
            400,
            doc.y - 14,
            { align: 'right', width: 145 }
          )
          .moveDown(1.5);

        // 分隔線
        doc
          .strokeColor('#000000')
          .lineWidth(2)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown();

        // 實發薪資
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#000066')
          .text('實發薪資', 70)
          .fontSize(18)
          .text(
            `NT$ ${Number(payroll.netSalary).toLocaleString('zh-TW', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`,
            400,
            doc.y - 20,
            { align: 'right', width: 145 }
          )
          .moveDown(2);

        // 備註
        if (payroll.notes) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#666666')
            .text(`備註: ${payroll.notes}`);
        }

        // 頁腳
        doc
          .fontSize(8)
          .fillColor('#999999')
          .text(
            '本薪資單僅供參考，如有疑問請聯繫人力資源部門',
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();

        stream.on('finish', () => {
          // 更新數據庫記錄
          prisma.payroll
            .update({
              where: { id: payrollId },
              data: { payslipUrl: `/uploads/payslips/${filename}` },
            })
            .then(() => {
              resolve(`/uploads/payslips/${filename}`);
            })
            .catch(reject);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 批量生成薪資單
   */
  async generateBatchPayslips(period: string): Promise<{ success: number; failed: number; urls: string[] }> {
    const payrolls = await prisma.payroll.findMany({
      where: { period, status: { in: ['APPROVED', 'PAID'] } },
    });

    const results = {
      success: 0,
      failed: 0,
      urls: [] as string[],
    };

    for (const payroll of payrolls) {
      try {
        const url = await this.generatePayslip(payroll.id);
        results.success++;
        results.urls.push(url);
      } catch (error) {
        console.error(`Failed to generate payslip for ${payroll.id}:`, error);
        results.failed++;
      }
    }

    return results;
  }
}

export const payslipService = new PayslipService();
