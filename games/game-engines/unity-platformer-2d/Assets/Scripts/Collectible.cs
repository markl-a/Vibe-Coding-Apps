using UnityEngine;

/// <summary>
/// 收集品系統 - 處理金幣、寶石等收集物品
/// </summary>
[RequireComponent(typeof(Collider2D))]
public class Collectible : MonoBehaviour
{
    [Header("收集品設定")]
    [Tooltip("收集品分數")]
    public int value = 10;

    [Tooltip("收集品類型")]
    public CollectibleType type = CollectibleType.Coin;

    [Header("視覺效果")]
    [Tooltip("收集時是否播放動畫")]
    public bool playAnimation = true;

    [Tooltip("收集後是否立即銷毀")]
    public bool destroyImmediately = true;

    [Tooltip("銷毀延遲時間（秒）")]
    public float destroyDelay = 0f;

    [Header("音效")]
    [Tooltip("收集音效")]
    public AudioClip collectSound;

    [Header("粒子效果")]
    [Tooltip("收集時的粒子效果")]
    public GameObject collectEffect;

    private bool isCollected = false;

    void Start()
    {
        // 確保 Collider2D 設為 Trigger
        Collider2D col = GetComponent<Collider2D>();
        if (col != null)
        {
            col.isTrigger = true;
        }
    }

    void OnTriggerEnter2D(Collider2D collision)
    {
        // 防止重複收集
        if (isCollected) return;

        // 檢查是否為玩家
        if (collision.CompareTag("Player"))
        {
            Collect();
        }
    }

    /// <summary>
    /// 執行收集邏輯
    /// </summary>
    void Collect()
    {
        isCollected = true;

        // 播放音效
        PlayCollectSound();

        // 生成粒子效果
        SpawnCollectEffect();

        // 增加分數
        AddScore();

        // 觸發收集動畫
        if (playAnimation)
        {
            PlayCollectAnimation();
        }

        // 銷毀物件
        if (destroyImmediately && destroyDelay == 0f)
        {
            Destroy(gameObject);
        }
        else
        {
            Destroy(gameObject, destroyDelay);
        }
    }

    /// <summary>
    /// 播放收集音效
    /// </summary>
    void PlayCollectSound()
    {
        if (collectSound != null)
        {
            // 在世界空間播放音效（不隨物件銷毀而停止）
            AudioSource.PlayClipAtPoint(collectSound, transform.position);
        }
    }

    /// <summary>
    /// 生成收集粒子效果
    /// </summary>
    void SpawnCollectEffect()
    {
        if (collectEffect != null)
        {
            Instantiate(collectEffect, transform.position, Quaternion.identity);
        }
    }

    /// <summary>
    /// 增加分數
    /// </summary>
    void AddScore()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.AddScore(value);
            Debug.Log($"收集 {type}，獲得 {value} 分！");
        }
        else
        {
            Debug.LogWarning("找不到 GameManager！");
        }
    }

    /// <summary>
    /// 播放收集動畫
    /// </summary>
    void PlayCollectAnimation()
    {
        Animator animator = GetComponent<Animator>();
        if (animator != null)
        {
            animator.SetTrigger("Collect");
        }
    }

    /// <summary>
    /// 設定收集品數值
    /// </summary>
    public void SetValue(int newValue)
    {
        value = newValue;
    }

    /// <summary>
    /// 獲取收集品數值
    /// </summary>
    public int GetValue()
    {
        return value;
    }
}

/// <summary>
/// 收集品類型枚舉
/// </summary>
public enum CollectibleType
{
    Coin,       // 金幣
    Gem,        // 寶石
    PowerUp,    // 能力提升
    Health,     // 生命值
    Special     // 特殊物品
}
