using UnityEngine;

/// <summary>
/// 敵人 AI 控制器 - 支援巡邏和追擊
/// AI-Generated Template
/// </summary>
public class EnemyAI : MonoBehaviour
{
    [Header("移動設定")]
    [Tooltip("敵人移動速度")]
    public float moveSpeed = 3f;

    [Tooltip("巡邏點距離")]
    public float patrolDistance = 5f;

    [Header("追擊設定")]
    [Tooltip("追擊玩家的檢測範圍")]
    public float detectionRange = 8f;

    [Tooltip("攻擊範圍")]
    public float attackRange = 1.5f;

    [Tooltip("攻擊傷害")]
    public int damage = 10;

    [Tooltip("攻擊冷卻時間")]
    public float attackCooldown = 1f;

    [Header("生命值")]
    [Tooltip("最大生命值")]
    public int maxHealth = 50;

    [Tooltip("死亡時給予的分數")]
    public int scoreOnDeath = 100;

    [Header("視覺效果")]
    public Color normalColor = Color.white;
    public Color chaseColor = Color.red;
    public Color attackColor = Color.yellow;

    // 狀態
    private enum State { Patrol, Chase, Attack }
    private State currentState = State.Patrol;

    // 內部變數
    private int currentHealth;
    private Transform player;
    private Vector3 startPosition;
    private bool movingRight = true;
    private float lastAttackTime;
    private SpriteRenderer spriteRenderer;
    private Rigidbody2D rb;
    private Animator animator;

    void Start()
    {
        currentHealth = maxHealth;
        startPosition = transform.position;
        rb = GetComponent<Rigidbody2D>();
        spriteRenderer = GetComponent<SpriteRenderer>();
        animator = GetComponent<Animator>();

        // 尋找玩家
        GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
        if (playerObj != null)
        {
            player = playerObj.transform;
        }
    }

    void Update()
    {
        if (currentHealth <= 0) return;

        // 檢測玩家距離並切換狀態
        float distanceToPlayer = player != null ? Vector3.Distance(transform.position, player.position) : float.MaxValue;

        if (distanceToPlayer <= attackRange)
        {
            currentState = State.Attack;
        }
        else if (distanceToPlayer <= detectionRange)
        {
            currentState = State.Chase;
        }
        else
        {
            currentState = State.Patrol;
        }

        // 根據狀態執行行為
        switch (currentState)
        {
            case State.Patrol:
                Patrol();
                UpdateColor(normalColor);
                break;
            case State.Chase:
                Chase();
                UpdateColor(chaseColor);
                break;
            case State.Attack:
                Attack();
                UpdateColor(attackColor);
                break;
        }

        // 更新動畫
        if (animator != null)
        {
            animator.SetFloat("Speed", Mathf.Abs(rb.velocity.x));
            animator.SetBool("IsAttacking", currentState == State.Attack);
        }
    }

    /// <summary>
    /// 巡邏行為 - 在起始點左右移動
    /// </summary>
    void Patrol()
    {
        // 計算移動距離
        float distanceFromStart = transform.position.x - startPosition.x;

        // 到達巡邏邊界時轉向
        if (movingRight && distanceFromStart >= patrolDistance)
        {
            movingRight = false;
        }
        else if (!movingRight && distanceFromStart <= -patrolDistance)
        {
            movingRight = true;
        }

        // 移動
        float direction = movingRight ? 1 : -1;
        rb.velocity = new Vector2(direction * moveSpeed, rb.velocity.y);

        // 更新朝向
        if (spriteRenderer != null)
        {
            spriteRenderer.flipX = !movingRight;
        }
    }

    /// <summary>
    /// 追擊行為 - 追擊玩家
    /// </summary>
    void Chase()
    {
        if (player == null) return;

        // 朝玩家方向移動
        float direction = Mathf.Sign(player.position.x - transform.position.x);
        rb.velocity = new Vector2(direction * moveSpeed * 1.5f, rb.velocity.y);

        // 更新朝向
        if (spriteRenderer != null)
        {
            spriteRenderer.flipX = direction < 0;
        }
    }

    /// <summary>
    /// 攻擊行為 - 對玩家造成傷害
    /// </summary>
    void Attack()
    {
        // 停止移動
        rb.velocity = new Vector2(0, rb.velocity.y);

        // 檢查攻擊冷卻
        if (Time.time - lastAttackTime >= attackCooldown)
        {
            lastAttackTime = Time.time;

            // 對玩家造成傷害
            if (player != null)
            {
                PlayerHealth playerHealth = player.GetComponent<PlayerHealth>();
                if (playerHealth != null)
                {
                    playerHealth.TakeDamage(damage);
                }
            }

            Debug.Log($"敵人攻擊! 造成 {damage} 點傷害");
        }
    }

    /// <summary>
    /// 受到傷害
    /// </summary>
    public void TakeDamage(int damageAmount)
    {
        currentHealth -= damageAmount;
        Debug.Log($"敵人受到 {damageAmount} 點傷害! 剩餘生命: {currentHealth}");

        // 受傷閃爍效果
        StartCoroutine(FlashEffect());

        if (currentHealth <= 0)
        {
            Die();
        }
    }

    /// <summary>
    /// 死亡處理
    /// </summary>
    void Die()
    {
        Debug.Log("敵人死亡!");

        // 增加分數
        if (GameManager.Instance != null)
        {
            GameManager.Instance.AddScore(scoreOnDeath);
        }

        // 播放死亡動畫
        if (animator != null)
        {
            animator.SetTrigger("Death");
        }

        // 銷毀敵人
        Destroy(gameObject, 0.5f);
    }

    /// <summary>
    /// 受傷閃爍效果
    /// </summary>
    System.Collections.IEnumerator FlashEffect()
    {
        if (spriteRenderer != null)
        {
            Color originalColor = spriteRenderer.color;
            spriteRenderer.color = Color.red;
            yield return new WaitForSeconds(0.1f);
            spriteRenderer.color = originalColor;
        }
    }

    /// <summary>
    /// 更新敵人顏色（根據狀態）
    /// </summary>
    void UpdateColor(Color targetColor)
    {
        if (spriteRenderer != null)
        {
            spriteRenderer.color = Color.Lerp(spriteRenderer.color, targetColor, Time.deltaTime * 5f);
        }
    }

    /// <summary>
    /// 繪製 Gizmos - 顯示偵測範圍
    /// </summary>
    void OnDrawGizmosSelected()
    {
        // 巡邏範圍
        Vector3 pos = Application.isPlaying ? startPosition : transform.position;
        Gizmos.color = Color.green;
        Gizmos.DrawLine(pos + Vector3.left * patrolDistance, pos + Vector3.right * patrolDistance);

        // 偵測範圍
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, detectionRange);

        // 攻擊範圍
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(transform.position, attackRange);
    }
}
