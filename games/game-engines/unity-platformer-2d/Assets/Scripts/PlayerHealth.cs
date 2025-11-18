using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// 玩家生命值系統
/// AI-Generated Template
/// </summary>
public class PlayerHealth : MonoBehaviour
{
    [Header("生命值設定")]
    [Tooltip("最大生命值")]
    public int maxHealth = 100;

    [Tooltip("無敵時間（受傷後）")]
    public float invincibilityDuration = 1.5f;

    [Header("視覺效果")]
    [Tooltip("受傷時的閃爍次數")]
    public int flashCount = 3;

    [Header("音效")]
    public AudioClip hurtSound;
    public AudioClip deathSound;
    public AudioClip healSound;

    // 當前狀態
    private int currentHealth;
    private bool isInvincible = false;
    private float invincibilityTimer = 0f;
    private SpriteRenderer spriteRenderer;
    private Animator animator;
    private AudioSource audioSource;

    void Start()
    {
        currentHealth = maxHealth;
        spriteRenderer = GetComponent<SpriteRenderer>();
        animator = GetComponent<Animator>();
        audioSource = GetComponent<AudioSource>();

        // 更新 UI
        UpdateHealthUI();
    }

    void Update()
    {
        // 處理無敵時間
        if (isInvincible)
        {
            invincibilityTimer -= Time.deltaTime;
            if (invincibilityTimer <= 0)
            {
                isInvincible = false;
                if (spriteRenderer != null)
                {
                    spriteRenderer.color = Color.white;
                }
            }
        }
    }

    /// <summary>
    /// 受到傷害
    /// </summary>
    public void TakeDamage(int damage)
    {
        // 如果處於無敵狀態，忽略傷害
        if (isInvincible)
        {
            return;
        }

        // 扣除生命值
        currentHealth -= damage;
        currentHealth = Mathf.Max(currentHealth, 0);

        Debug.Log($"玩家受到 {damage} 點傷害! 剩餘生命: {currentHealth}/{maxHealth}");

        // 播放受傷音效
        PlaySound(hurtSound);

        // 播放受傷動畫
        if (animator != null)
        {
            animator.SetTrigger("Hurt");
        }

        // 開啟無敵狀態
        StartInvincibility();

        // 更新 UI
        UpdateHealthUI();

        // 檢查是否死亡
        if (currentHealth <= 0)
        {
            Die();
        }
    }

    /// <summary>
    /// 治療
    /// </summary>
    public void Heal(int amount)
    {
        int healedAmount = Mathf.Min(amount, maxHealth - currentHealth);
        currentHealth += healedAmount;
        currentHealth = Mathf.Min(currentHealth, maxHealth);

        Debug.Log($"玩家恢復 {healedAmount} 點生命! 當前生命: {currentHealth}/{maxHealth}");

        // 播放治療音效
        PlaySound(healSound);

        // 更新 UI
        UpdateHealthUI();
    }

    /// <summary>
    /// 死亡處理
    /// </summary>
    void Die()
    {
        Debug.Log("玩家死亡!");

        // 播放死亡音效
        PlaySound(deathSound);

        // 播放死亡動畫
        if (animator != null)
        {
            animator.SetTrigger("Death");
        }

        // 禁用玩家控制
        PlayerController controller = GetComponent<PlayerController>();
        if (controller != null)
        {
            controller.enabled = false;
        }

        // 通知 GameManager
        if (GameManager.Instance != null)
        {
            GameManager.Instance.LoseLife();
        }

        // 延遲重新載入場景
        Invoke(nameof(RestartLevel), 2f);
    }

    /// <summary>
    /// 重新載入關卡
    /// </summary>
    void RestartLevel()
    {
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }

    /// <summary>
    /// 開啟無敵狀態
    /// </summary>
    void StartInvincibility()
    {
        isInvincible = true;
        invincibilityTimer = invincibilityDuration;

        // 開始閃爍效果
        StartCoroutine(FlashEffect());
    }

    /// <summary>
    /// 閃爍效果
    /// </summary>
    System.Collections.IEnumerator FlashEffect()
    {
        if (spriteRenderer == null) yield break;

        float flashDuration = invincibilityDuration / (flashCount * 2);

        for (int i = 0; i < flashCount; i++)
        {
            // 變透明
            spriteRenderer.color = new Color(1, 1, 1, 0.3f);
            yield return new WaitForSeconds(flashDuration);

            // 變回正常
            spriteRenderer.color = Color.white;
            yield return new WaitForSeconds(flashDuration);
        }

        // 確保最後恢復正常顏色
        spriteRenderer.color = Color.white;
    }

    /// <summary>
    /// 更新生命值 UI
    /// </summary>
    void UpdateHealthUI()
    {
        // 發送事件給 UI Manager
        UIManager uiManager = FindObjectOfType<UIManager>();
        if (uiManager != null)
        {
            uiManager.UpdateHealth(currentHealth, maxHealth);
        }
    }

    /// <summary>
    /// 播放音效
    /// </summary>
    void PlaySound(AudioClip clip)
    {
        if (clip != null && audioSource != null)
        {
            audioSource.PlayOneShot(clip);
        }
    }

    /// <summary>
    /// 獲取當前生命值
    /// </summary>
    public int GetCurrentHealth()
    {
        return currentHealth;
    }

    /// <summary>
    /// 獲取最大生命值
    /// </summary>
    public int GetMaxHealth()
    {
        return maxHealth;
    }

    /// <summary>
    /// 檢查是否還活著
    /// </summary>
    public bool IsAlive()
    {
        return currentHealth > 0;
    }

    /// <summary>
    /// 設置生命值（用於存檔系統）
    /// </summary>
    public void SetHealth(int health)
    {
        currentHealth = Mathf.Clamp(health, 0, maxHealth);
        UpdateHealthUI();
    }
}
