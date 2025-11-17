"""
股市分析 - 完整使用範例
演示如何使用技術指標、機器學習進行股票分析和交易信號生成
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import warnings
warnings.filterwarnings('ignore')

# 設置中文字體
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================================
# 1. 生成示例股票數據
# ============================================================================
def generate_sample_stock_data(symbol='AAPL', n_days=365, random_state=42):
    """
    生成示例股票價格數據
    """
    np.random.seed(random_state)

    # 日期序列
    start_date = datetime(2023, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(n_days)]

    # 生成價格數據（隨機遊走）
    initial_price = 100
    returns = np.random.normal(0.0005, 0.02, n_days)  # 每日收益率
    prices = initial_price * np.exp(np.cumsum(returns))

    # 添加高、低、成交量
    highs = prices * (1 + np.abs(np.random.normal(0, 0.01, n_days)))
    lows = prices * (1 - np.abs(np.random.normal(0, 0.01, n_days)))
    volumes = np.random.randint(1000000, 5000000, n_days)

    df = pd.DataFrame({
        'Date': dates,
        'Close': prices,
        'High': highs,
        'Low': lows,
        'Volume': volumes,
        'Open': prices * (1 + np.random.normal(0, 0.005, n_days))
    })

    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
    df['Symbol'] = symbol

    return df


# ============================================================================
# 2. 技術指標計算
# ============================================================================
def calculate_technical_indicators(df):
    """
    計算常用的技術指標
    """
    print("=" * 80)
    print("1. 技術指標計算")
    print("=" * 80)

    df = df.copy()
    close = df['Close'].values
    high = df['High'].values
    low = df['Low'].values
    volume = df['Volume'].values

    # 簡單移動平均 (SMA)
    df['SMA_20'] = pd.Series(close).rolling(window=20).mean()
    df['SMA_50'] = pd.Series(close).rolling(window=50).mean()
    df['SMA_200'] = pd.Series(close).rolling(window=200).mean()

    # 指數移動平均 (EMA)
    df['EMA_12'] = pd.Series(close).ewm(span=12, adjust=False).mean()
    df['EMA_26'] = pd.Series(close).ewm(span=26, adjust=False).mean()

    # 相對強弱指標 (RSI)
    delta = np.diff(close)
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)

    avg_gain = pd.Series(gain).rolling(window=14).mean()
    avg_loss = pd.Series(loss).rolling(window=14).mean()

    rs = avg_gain / (avg_loss + 1e-10)
    df['RSI_14'] = 100 - (100 / (1 + rs))

    # MACD
    ema12 = pd.Series(close).ewm(span=12, adjust=False).mean()
    ema26 = pd.Series(close).ewm(span=26, adjust=False).mean()
    df['MACD'] = ema12 - ema26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()

    # 布林通道 (Bollinger Bands)
    sma20 = df['SMA_20']
    std20 = pd.Series(close).rolling(window=20).std()
    df['BB_Upper'] = sma20 + (std20 * 2)
    df['BB_Lower'] = sma20 - (std20 * 2)

    print("\n計算的技術指標:")
    print("  ✅ SMA (20, 50, 200) - 簡單移動平均")
    print("  ✅ EMA (12, 26) - 指數移動平均")
    print("  ✅ RSI (14) - 相對強弱指標")
    print("  ✅ MACD - 移動平均收斂發散")
    print("  ✅ Bollinger Bands - 布林通道")

    return df


# ============================================================================
# 3. 數據分析
# ============================================================================
def analyze_stock_data(df):
    """
    分析股票數據的基本統計
    """
    print("\n" + "=" * 80)
    print("2. 股票數據分析")
    print("=" * 80)

    close = df['Close'].values

    print("\n價格統計:")
    print(f"  當前價格: ${close[-1]:.2f}")
    print(f"  最高價: ${close.max():.2f}")
    print(f"  最低價: ${close.min():.2f}")
    print(f"  平均價格: ${close.mean():.2f}")
    print(f"  標準差: ${close.std():.2f}")

    # 收益率
    returns = np.diff(close) / close[:-1]
    annual_return = (1 + returns.mean()) ** 252 - 1
    annual_volatility = returns.std() * np.sqrt(252)

    print("\n風險收益指標:")
    print(f"  年化收益率: {annual_return:.2%}")
    print(f"  年化波動率: {annual_volatility:.2%}")
    print(f"  Sharpe Ratio (假設無風險利率0%): {annual_return / annual_volatility:.2f}")

    # 成交量分析
    print("\n成交量分析:")
    print(f"  平均成交量: {df['Volume'].mean():,.0f}")
    print(f"  最大成交量: {df['Volume'].max():,.0f}")
    print(f"  最小成交量: {df['Volume'].min():,.0f}")

    return {
        'annual_return': annual_return,
        'annual_volatility': annual_volatility,
        'sharpe_ratio': annual_return / annual_volatility
    }


# ============================================================================
# 4. 交易信號生成
# ============================================================================
def generate_trading_signals(df):
    """
    基於技術指標生成交易信號
    """
    print("\n" + "=" * 80)
    print("3. 交易信號生成")
    print("=" * 80)

    df = df.copy()

    # 移動平均交叉信號
    df['MA_Signal'] = 0
    df.loc[df['SMA_20'] > df['SMA_50'], 'MA_Signal'] = 1  # 買入信號
    df.loc[df['SMA_20'] < df['SMA_50'], 'MA_Signal'] = -1  # 賣出信號

    # RSI 信號
    df['RSI_Signal'] = 0
    df.loc[df['RSI_14'] < 30, 'RSI_Signal'] = 1  # 超賣，買入
    df.loc[df['RSI_14'] > 70, 'RSI_Signal'] = -1  # 超買，賣出

    # MACD 信號
    df['MACD_Signal_Flag'] = 0
    df.loc[df['MACD'] > df['MACD_Signal'], 'MACD_Signal_Flag'] = 1  # 買入
    df.loc[df['MACD'] < df['MACD_Signal'], 'MACD_Signal_Flag'] = -1  # 賣出

    # 綜合信號（投票制）
    df['Composite_Signal'] = (df['MA_Signal'] + df['RSI_Signal'] + df['MACD_Signal_Flag']) / 3

    print("\n信號統計:")
    ma_buy = (df['MA_Signal'] == 1).sum()
    ma_sell = (df['MA_Signal'] == -1).sum()
    print(f"  MA交叉 - 買入: {ma_buy}, 賣出: {ma_sell}")

    rsi_buy = (df['RSI_Signal'] == 1).sum()
    rsi_sell = (df['RSI_Signal'] == -1).sum()
    print(f"  RSI - 買入: {rsi_buy}, 賣出: {rsi_sell}")

    macd_buy = (df['MACD_Signal_Flag'] == 1).sum()
    macd_sell = (df['MACD_Signal_Flag'] == -1).sum()
    print(f"  MACD - 買入: {macd_buy}, 賣出: {macd_sell}")

    # 最新信號
    latest_signal = df['Composite_Signal'].iloc[-1]
    if latest_signal > 0.2:
        signal_text = "強買入"
    elif latest_signal > 0:
        signal_text = "買入"
    elif latest_signal < -0.2:
        signal_text = "強賣出"
    elif latest_signal < 0:
        signal_text = "賣出"
    else:
        signal_text = "持平"

    print(f"\n最新信號: {signal_text} (綜合得分: {latest_signal:.2f})")

    return df


# ============================================================================
# 5. 回測交易策略
# ============================================================================
def backtest_strategy(df, initial_capital=10000, commission=0.001):
    """
    回測簡單的移動平均交易策略
    """
    print("\n" + "=" * 80)
    print("4. 交易策略回測")
    print("=" * 80)

    df = df.copy()

    # 基於MA信號的交易
    position = 0
    capital = initial_capital
    shares = 0
    portfolio_value = [capital]
    trades = []

    for i in range(1, len(df)):
        signal = df['MA_Signal'].iloc[i]
        price = df['Close'].iloc[i]
        date = df['Date'].iloc[i]

        # 買入信號
        if signal == 1 and position == 0:
            shares = (capital * (1 - commission)) / price
            position = 1
            trades.append({'date': date, 'type': '買入', 'price': price, 'shares': shares})

        # 賣出信號
        elif signal == -1 and position == 1:
            capital = shares * price * (1 - commission)
            position = 0
            trades.append({'date': date, 'type': '賣出', 'price': price, 'capital': capital})
            shares = 0

        # 計算投資組合價值
        if position == 1:
            portfolio_value.append(shares * price)
        else:
            portfolio_value.append(capital)

    # 最終清倉
    if position == 1:
        capital = shares * df['Close'].iloc[-1] * (1 - commission)

    final_value = capital
    total_return = (final_value - initial_capital) / initial_capital
    num_trades = len([t for t in trades if t['type'] == '買入'])

    print(f"\n交易策略性能:")
    print(f"  初始資本: ${initial_capital:,.2f}")
    print(f"  最終資本: ${final_value:,.2f}")
    print(f"  總收益: ${final_value - initial_capital:,.2f}")
    print(f"  收益率: {total_return:.2%}")
    print(f"  交易次數: {num_trades}")
    print(f"  平均交易收益: {total_return / max(num_trades, 1):.2%}")

    # 與buy-and-hold的比較
    buy_hold_final = initial_capital * (df['Close'].iloc[-1] / df['Close'].iloc[0])
    buy_hold_return = (buy_hold_final - initial_capital) / initial_capital

    print(f"\nBuy & Hold策略性能:")
    print(f"  最終資本: ${buy_hold_final:,.2f}")
    print(f"  收益率: {buy_hold_return:.2%}")

    if total_return > buy_hold_return:
        print(f"\n✅ 交易策略表現優於Buy & Hold {(total_return - buy_hold_return)*100:.1f}%")
    else:
        print(f"\n⚠️  交易策略表現不如Buy & Hold {(buy_hold_return - total_return)*100:.1f}%")

    return {
        'final_value': final_value,
        'total_return': total_return,
        'trades': trades,
        'portfolio_value': portfolio_value
    }


# ============================================================================
# 6. 機器學習預測
# ============================================================================
def ml_price_prediction(df):
    """
    使用機器學習預測價格漲跌
    """
    print("\n" + "=" * 80)
    print("5. 機器學習價格預測")
    print("=" * 80)

    df = df.copy()

    # 準備特徵
    df['Returns'] = df['Close'].pct_change()
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)  # 1: 上漲, 0: 下跌

    # 選擇特徵
    feature_cols = ['SMA_20', 'SMA_50', 'RSI_14', 'MACD']
    df_ml = df[feature_cols + ['Target']].dropna()

    if len(df_ml) < 100:
        print("數據不足，無法進行機器學習預測")
        return None

    # 分割數據（80%訓練，20%測試）
    split_idx = int(len(df_ml) * 0.8)
    X_train, X_test = df_ml[feature_cols].iloc[:split_idx], df_ml[feature_cols].iloc[split_idx:]
    y_train, y_test = df_ml['Target'].iloc[:split_idx], df_ml['Target'].iloc[split_idx:]

    # 訓練模型
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 評估
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)

    print(f"\nRandom Forest模型性能:")
    print(f"  準確度: {accuracy:.2%}")
    print(f"  精確度: {precision:.2%}")
    print(f"  召回率: {recall:.2%}")

    # 特徵重要性
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    print(f"\n特徵重要性:")
    for _, row in importance_df.iterrows():
        print(f"  {row['feature']}: {row['importance']:.3f}")

    # 預測最新數據
    latest_features = df_ml[feature_cols].iloc[-1:].values
    latest_pred_proba = model.predict_proba(latest_features)[0]

    print(f"\n最新預測:")
    print(f"  上漲概率: {latest_pred_proba[1]:.2%}")
    print(f"  下跌概率: {latest_pred_proba[0]:.2%}")

    return {
        'model': model,
        'accuracy': accuracy,
        'importance': importance_df,
        'latest_prediction': latest_pred_proba[1]
    }


# ============================================================================
# 7. 可視化
# ============================================================================
def visualize_analysis(df, backtest_result):
    """
    可視化分析結果
    """
    print("\n" + "=" * 80)
    print("6. 結果可視化")
    print("=" * 80)

    fig = plt.figure(figsize=(16, 12))
    gs = fig.add_gridspec(3, 2, hspace=0.3, wspace=0.3)

    # 1. 價格與移動平均
    ax1 = fig.add_subplot(gs[0, :])
    ax1.plot(df['Date'], df['Close'], label='收盤價', linewidth=2)
    ax1.plot(df['Date'], df['SMA_20'], label='SMA 20', alpha=0.7)
    ax1.plot(df['Date'], df['SMA_50'], label='SMA 50', alpha=0.7)
    ax1.fill_between(df['Date'], df['BB_Upper'], df['BB_Lower'], alpha=0.2, label='布林通道')
    ax1.set_title('股票價格與技術指標', fontsize=12, fontweight='bold')
    ax1.set_ylabel('價格 ($)')
    ax1.legend(loc='best')
    ax1.grid(True, alpha=0.3)

    # 2. RSI指標
    ax2 = fig.add_subplot(gs[1, 0])
    ax2.plot(df['Date'], df['RSI_14'], label='RSI 14', color='orange')
    ax2.axhline(y=70, color='r', linestyle='--', alpha=0.5, label='超買')
    ax2.axhline(y=30, color='g', linestyle='--', alpha=0.5, label='超賣')
    ax2.set_title('RSI指標', fontsize=12, fontweight='bold')
    ax2.set_ylabel('RSI')
    ax2.set_ylim(0, 100)
    ax2.legend(loc='best')
    ax2.grid(True, alpha=0.3)

    # 3. MACD指標
    ax3 = fig.add_subplot(gs[1, 1])
    ax3.bar(df['Date'], df['MACD'], label='MACD', alpha=0.3)
    ax3.plot(df['Date'], df['MACD_Signal'], label='Signal', color='red')
    ax3.set_title('MACD指標', fontsize=12, fontweight='bold')
    ax3.set_ylabel('MACD')
    ax3.legend(loc='best')
    ax3.grid(True, alpha=0.3)

    # 4. 成交量
    ax4 = fig.add_subplot(gs[2, 0])
    ax4.bar(df['Date'], df['Volume'], alpha=0.3, color='steelblue')
    ax4.set_title('成交量', fontsize=12, fontweight='bold')
    ax4.set_ylabel('成交量')
    ax4.grid(True, alpha=0.3)

    # 5. 投資組合價值
    if backtest_result:
        ax5 = fig.add_subplot(gs[2, 1])
        dates = df['Date'].iloc[1:len(backtest_result['portfolio_value'])+1].values
        ax5.plot(dates, backtest_result['portfolio_value'], label='投資組合價值', linewidth=2)
        ax5.fill_between(dates, backtest_result['portfolio_value'], alpha=0.3)
        ax5.set_title('回測投資組合價值', fontsize=12, fontweight='bold')
        ax5.set_ylabel('價值 ($)')
        ax5.grid(True, alpha=0.3)

    plt.savefig('stock_analysis.png', dpi=300, bbox_inches='tight')
    print("\n✅ 圖表已保存為: stock_analysis.png")
    plt.show()


# ============================================================================
# 主程序
# ============================================================================
def main():
    """
    完整的股票分析示例
    """
    print("\n" + "=" * 80)
    print("股市分析 - 完整使用範例")
    print("=" * 80)

    # 1. 生成數據
    print("\n準備數據...")
    df = generate_sample_stock_data(symbol='AAPL', n_days=365)

    # 2. 計算技術指標
    df = calculate_technical_indicators(df)

    # 3. 數據分析
    stats = analyze_stock_data(df)

    # 4. 生成交易信號
    df = generate_trading_signals(df)

    # 5. 回測策略
    backtest_result = backtest_strategy(df)

    # 6. 機器學習預測
    ml_result = ml_price_prediction(df)

    # 7. 可視化
    visualize_analysis(df, backtest_result)

    # 8. 投資建議
    print("\n" + "=" * 80)
    print("7. 投資建議")
    print("=" * 80)

    print(f"\n技術指標總體評估:")
    ma_signal = df['MA_Signal'].iloc[-1]
    rsi_signal = df['RSI_14'].iloc[-1]
    macd_signal = df['MACD'].iloc[-1] > df['MACD_Signal'].iloc[-1]

    signals = 0
    if ma_signal == 1:
        signals += 1
        print("  ✅ MA交叉: 買入信號")
    else:
        print("  ❌ MA交叉: 賣出信號")

    if 30 < rsi_signal < 70:
        print("  ✅ RSI: 處於合理區間")
    elif rsi_signal <= 30:
        print("  ✅ RSI: 超賣，潛在買入機會")
    else:
        print("  ⚠️  RSI: 超買，需謹慎")

    if macd_signal:
        signals += 1
        print("  ✅ MACD: 買入信號")
    else:
        print("  ❌ MACD: 賣出信號")

    print(f"\n總體評級: {signals}/3 買入信號")

    if ml_result:
        print(f"\nML預測:")
        print(f"  模型準確度: {ml_result['accuracy']:.2%}")
        print(f"  下個交易日上漲概率: {ml_result['latest_prediction']:.2%}")

    print("\n⚠️  免責聲明: 本分析僅供參考，不構成投資建議")

    print("\n" + "=" * 80)
    print("✅ 分析完成！")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
