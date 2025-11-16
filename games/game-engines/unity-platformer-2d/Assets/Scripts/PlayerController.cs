using UnityEngine;

/// <summary>
/// 玩家角色控制器 - 處理移動、跳躍和動畫
/// </summary>
public class PlayerController : MonoBehaviour
{
    [Header("移動設定")]
    [Tooltip("水平移動速度")]
    public float moveSpeed = 5f;

    [Tooltip("跳躍力度")]
    public float jumpForce = 10f;

    [Header("地面檢測")]
    [Tooltip("地面檢測點")]
    public Transform groundCheck;

    [Tooltip("地面檢測半徑")]
    public float groundCheckRadius = 0.2f;

    [Tooltip("地面圖層")]
    public LayerMask groundLayer;

    [Header("音效")]
    [Tooltip("跳躍音效")]
    public AudioClip jumpSound;

    [Tooltip("落地音效")]
    public AudioClip landSound;

    // 組件引用
    private Rigidbody2D rb;
    private Animator animator;
    private AudioSource audioSource;

    // 狀態變數
    private bool isGrounded;
    private bool wasGrounded;
    private float moveInput;

    void Start()
    {
        // 獲取組件
        rb = GetComponent<Rigidbody2D>();
        animator = GetComponent<Animator>();
        audioSource = GetComponent<AudioSource>();

        // 如果沒有 AudioSource 則添加一個
        if (audioSource == null)
            audioSource = gameObject.AddComponent<AudioSource>();
    }

    void Update()
    {
        // 獲取水平輸入 (-1 到 1)
        moveInput = Input.GetAxisRaw("Horizontal");

        // 地面檢測
        wasGrounded = isGrounded;
        isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundLayer);

        // 檢測落地
        if (isGrounded && !wasGrounded)
        {
            PlaySound(landSound);
        }

        // 跳躍輸入處理
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            Jump();
        }

        // 更新動畫參數
        UpdateAnimations();

        // 翻轉角色朝向
        FlipCharacter();
    }

    void FixedUpdate()
    {
        // 在 FixedUpdate 中處理物理移動
        rb.velocity = new Vector2(moveInput * moveSpeed, rb.velocity.y);
    }

    /// <summary>
    /// 執行跳躍
    /// </summary>
    void Jump()
    {
        rb.velocity = new Vector2(rb.velocity.x, jumpForce);
        PlaySound(jumpSound);
    }

    /// <summary>
    /// 更新動畫狀態
    /// </summary>
    void UpdateAnimations()
    {
        if (animator != null)
        {
            animator.SetFloat("Speed", Mathf.Abs(moveInput));
            animator.SetBool("IsGrounded", isGrounded);
            animator.SetFloat("VelocityY", rb.velocity.y);
        }
    }

    /// <summary>
    /// 根據移動方向翻轉角色
    /// </summary>
    void FlipCharacter()
    {
        if (moveInput > 0)
        {
            // 向右移動
            transform.localScale = new Vector3(1, 1, 1);
        }
        else if (moveInput < 0)
        {
            // 向左移動
            transform.localScale = new Vector3(-1, 1, 1);
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
    /// 在編輯器中顯示地面檢測範圍
    /// </summary>
    void OnDrawGizmosSelected()
    {
        if (groundCheck == null) return;

        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(groundCheck.position, groundCheckRadius);
    }

    /// <summary>
    /// 受傷處理
    /// </summary>
    public void TakeDamage()
    {
        // 通知 GameManager 減少生命值
        GameManager.Instance?.LoseLife();

        // 可以添加受傷動畫和音效
        if (animator != null)
        {
            animator.SetTrigger("Hit");
        }
    }

    /// <summary>
    /// 獲取當前移動速度（供其他腳本使用）
    /// </summary>
    public float GetCurrentSpeed()
    {
        return Mathf.Abs(rb.velocity.x);
    }

    /// <summary>
    /// 檢查是否在地面上（供其他腳本使用）
    /// </summary>
    public bool IsGrounded()
    {
        return isGrounded;
    }
}
