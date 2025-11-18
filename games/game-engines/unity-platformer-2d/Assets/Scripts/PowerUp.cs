using UnityEngine;

/// <summary>
/// 道具系統 - 支援多種道具類型
/// AI-Generated Template
/// </summary>
public class PowerUp : MonoBehaviour
{
    [Header("道具類型")]
    [Tooltip("道具類型")]
    public PowerUpType type = PowerUpType.Health;

    [Header("道具屬性")]
    [Tooltip("生命恢復量（Health類型）")]
    public int healthAmount = 20;

    [Tooltip("分數獎勵（Score類型）")]
    public int scoreAmount = 50;

    [Tooltip("速度增幅倍率（SpeedBoost類型）")]
    public float speedMultiplier = 1.5f;

    [Tooltip("跳躍力增幅倍率（JumpBoost類型）")]
    public float jumpMultiplier = 1.3f;

    [Tooltip("效果持續時間（增益類型）")]
    public float duration = 5f;

    [Tooltip("無敵時間（Invincibility類型）")]
    public float invincibilityDuration = 10f;

    [Header("視覺效果")]
    public AudioClip collectSound;
    public GameObject collectEffect;

    [Tooltip("旋轉速度")]
    public float rotationSpeed = 100f;

    [Tooltip("上下浮動")]
    public bool bobbing = true;
    public float bobbingHeight = 0.3f;
    public float bobbingSpeed = 2f;

    // 內部變數
    private Vector3 startPosition;
    private SpriteRenderer spriteRenderer;

    void Start()
    {
        startPosition = transform.position;
        spriteRenderer = GetComponent<SpriteRenderer>();

        // 根據類型設置顏色
        SetColorByType();
    }

    void Update()
    {
        // 旋轉效果
        transform.Rotate(Vector3.forward, rotationSpeed * Time.deltaTime);

        // 上下浮動效果
        if (bobbing)
        {
            float newY = startPosition.y + Mathf.Sin(Time.time * bobbingSpeed) * bobbingHeight;
            transform.position = new Vector3(transform.position.x, newY, transform.position.z);
        }
    }

    void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.CompareTag("Player"))
        {
            ApplyPowerUp(collision.gameObject);
            Collect();
        }
    }

    /// <summary>
    /// 應用道具效果
    /// </summary>
    void ApplyPowerUp(GameObject player)
    {
        switch (type)
        {
            case PowerUpType.Health:
                ApplyHealth(player);
                break;
            case PowerUpType.Score:
                ApplyScore();
                break;
            case PowerUpType.SpeedBoost:
                ApplySpeedBoost(player);
                break;
            case PowerUpType.JumpBoost:
                ApplyJumpBoost(player);
                break;
            case PowerUpType.Invincibility:
                ApplyInvincibility(player);
                break;
            case PowerUpType.DoubleJump:
                ApplyDoubleJump(player);
                break;
        }
    }

    /// <summary>
    /// 恢復生命值
    /// </summary>
    void ApplyHealth(GameObject player)
    {
        PlayerHealth health = player.GetComponent<PlayerHealth>();
        if (health != null)
        {
            health.Heal(healthAmount);
            Debug.Log($"獲得生命道具! 恢復 {healthAmount} 點生命");
        }
    }

    /// <summary>
    /// 增加分數
    /// </summary>
    void ApplyScore()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.AddScore(scoreAmount);
            Debug.Log($"獲得分數道具! +{scoreAmount} 分");
        }
    }

    /// <summary>
    /// 速度增益
    /// </summary>
    void ApplySpeedBoost(GameObject player)
    {
        PlayerController controller = player.GetComponent<PlayerController>();
        if (controller != null)
        {
            StartCoroutine(TemporarySpeedBoost(controller));
            Debug.Log($"獲得速度增益! 持續 {duration} 秒");
        }
    }

    /// <summary>
    /// 跳躍力增益
    /// </summary>
    void ApplyJumpBoost(GameObject player)
    {
        PlayerController controller = player.GetComponent<PlayerController>();
        if (controller != null)
        {
            StartCoroutine(TemporaryJumpBoost(controller));
            Debug.Log($"獲得跳躍增益! 持續 {duration} 秒");
        }
    }

    /// <summary>
    /// 無敵效果
    /// </summary>
    void ApplyInvincibility(GameObject player)
    {
        // 這裡需要配合 PlayerHealth 的無敵狀態實現
        Debug.Log($"獲得無敵狀態! 持續 {invincibilityDuration} 秒");
        // TODO: 實現無敵邏輯
    }

    /// <summary>
    /// 二段跳
    /// </summary>
    void ApplyDoubleJump(GameObject player)
    {
        // TODO: 實現二段跳邏輯
        Debug.Log($"獲得二段跳能力! 持續 {duration} 秒");
    }

    /// <summary>
    /// 臨時速度增益協程
    /// </summary>
    System.Collections.IEnumerator TemporarySpeedBoost(PlayerController controller)
    {
        float originalSpeed = controller.moveSpeed;
        controller.moveSpeed *= speedMultiplier;

        yield return new WaitForSeconds(duration);

        controller.moveSpeed = originalSpeed;
        Debug.Log("速度增益結束");
    }

    /// <summary>
    /// 臨時跳躍增益協程
    /// </summary>
    System.Collections.IEnumerator TemporaryJumpBoost(PlayerController controller)
    {
        float originalJumpForce = controller.jumpForce;
        controller.jumpForce *= jumpMultiplier;

        yield return new WaitForSeconds(duration);

        controller.jumpForce = originalJumpForce;
        Debug.Log("跳躍增益結束");
    }

    /// <summary>
    /// 收集道具
    /// </summary>
    void Collect()
    {
        // 播放音效
        if (collectSound != null)
        {
            AudioSource.PlayClipAtPoint(collectSound, transform.position);
        }

        // 生成特效
        if (collectEffect != null)
        {
            Instantiate(collectEffect, transform.position, Quaternion.identity);
        }

        // 銷毀道具
        Destroy(gameObject);
    }

    /// <summary>
    /// 根據類型設置顏色
    /// </summary>
    void SetColorByType()
    {
        if (spriteRenderer == null) return;

        switch (type)
        {
            case PowerUpType.Health:
                spriteRenderer.color = Color.green;
                break;
            case PowerUpType.Score:
                spriteRenderer.color = Color.yellow;
                break;
            case PowerUpType.SpeedBoost:
                spriteRenderer.color = Color.cyan;
                break;
            case PowerUpType.JumpBoost:
                spriteRenderer.color = Color.blue;
                break;
            case PowerUpType.Invincibility:
                spriteRenderer.color = new Color(1f, 0.5f, 0f); // 橙色
                break;
            case PowerUpType.DoubleJump:
                spriteRenderer.color = Color.magenta;
                break;
        }
    }
}

/// <summary>
/// 道具類型列舉
/// </summary>
public enum PowerUpType
{
    Health,          // 生命恢復
    Score,           // 分數獎勵
    SpeedBoost,      // 速度增益
    JumpBoost,       // 跳躍增益
    Invincibility,   // 無敵
    DoubleJump       // 二段跳
}
