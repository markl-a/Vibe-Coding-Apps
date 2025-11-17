'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { CheckoutFormData } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const checkoutSchema = z.object({
  firstName: z.string().min(1, '請輸入名字'),
  lastName: z.string().min(1, '請輸入姓氏'),
  email: z.string().email('請輸入有效的電子郵件'),
  phone: z.string().min(10, '請輸入有效的電話號碼'),
  address: z.string().min(5, '請輸入完整地址'),
  city: z.string().min(1, '請輸入城市'),
  state: z.string().min(1, '請輸入州/省'),
  zipCode: z.string().min(3, '請輸入郵遞區號'),
  country: z.string().min(1, '請輸入國家'),
  cardNumber: z.string().regex(/^\d{16}$/, '請輸入16位數的卡號'),
  cardName: z.string().min(1, '請輸入持卡人姓名'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, '格式應為 MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, '請輸入3或4位數的CVV'),
  notes: z.string().optional(),
});

export function CheckoutForm() {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Order submitted:', data);

    // Clear cart and redirect
    clearCart();
    alert('訂單已成功送出！感謝您的購買。');
    router.push('/');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">個人資料</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="姓氏 *"
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder="王"
          />
          <Input
            label="名字 *"
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder="小明"
          />
          <Input
            label="電子郵件 *"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="example@email.com"
          />
          <Input
            label="電話 *"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="0912345678"
          />
        </div>
      </Card>

      {/* Shipping Address */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">配送地址</h2>
        <div className="space-y-4">
          <Input
            label="地址 *"
            {...register('address')}
            error={errors.address?.message}
            placeholder="中正路 123 號"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="城市 *"
              {...register('city')}
              error={errors.city?.message}
              placeholder="台北市"
            />
            <Input
              label="州/省 *"
              {...register('state')}
              error={errors.state?.message}
              placeholder="台灣"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="郵遞區號 *"
              {...register('zipCode')}
              error={errors.zipCode?.message}
              placeholder="10001"
            />
            <Input
              label="國家 *"
              {...register('country')}
              error={errors.country?.message}
              placeholder="台灣"
            />
          </div>
        </div>
      </Card>

      {/* Payment Information */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">付款資訊</h2>
        <div className="space-y-4">
          <Input
            label="信用卡號 *"
            {...register('cardNumber')}
            error={errors.cardNumber?.message}
            placeholder="1234567890123456"
            maxLength={16}
          />
          <Input
            label="持卡人姓名 *"
            {...register('cardName')}
            error={errors.cardName?.message}
            placeholder="WANG XIAOMING"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="有效期限 *"
              {...register('expiryDate')}
              error={errors.expiryDate?.message}
              placeholder="MM/YY"
              maxLength={5}
            />
            <Input
              label="CVV *"
              {...register('cvv')}
              error={errors.cvv?.message}
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>
      </Card>

      {/* Additional Notes */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">備註</h2>
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="訂單備註（選填）"
        />
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
      >
        {isSubmitting ? '處理中...' : '確認訂單'}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        點擊「確認訂單」即表示您同意我們的服務條款和隱私政策
      </p>
    </form>
  );
}
