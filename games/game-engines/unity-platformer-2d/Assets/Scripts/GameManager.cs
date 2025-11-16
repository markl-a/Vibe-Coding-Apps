using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// 遊戲管理器 - 管理遊戲狀態、分數、生命值等
/// </summary>
public class GameManager : MonoBehaviour
{
    // 單例模式
    public static GameManager Instance { get; private set; }

    [Header("遊戲狀態")]
    [Tooltip("當前分數")]
    public int score = 0;

    [Tooltip("當前生命值")]
    public int lives = 3;

    [Tooltip("最大生命值")]
    public int maxLives = 5;

    [Header("遊戲設定")]
    [Tooltip("遊戲是否暫停")]
    public bool isPaused = false;

    [Tooltip("遊戲是否結束")]
    public bool isGameOver = false;

    [Header("音效")]
    [Tooltip("遊戲結束音效")]
    public AudioClip gameOverSound;

    [Tooltip("獲得生命音效")]
    public AudioClip gainLifeSound;

    [Tooltip("失去生命音效")]
    public AudioClip loseLifeSound;

    // UI 管理器引用
    private UIManager uiManager;
    private AudioSource audioSource;

    void Awake()
    {
        // 實現單例模式
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject); // 切換場景時不銷毀
        }
        else
        {
            Destroy(gameObject);
            return;
        }

        // 添加 AudioSource 組件
        audioSource = gameObject.AddComponent<AudioSource>();
    }

    void Start()
    {
        // 尋找 UI 管理器
        uiManager = FindObjectOfType<UIManager>();
        if (uiManager == null)
        {
            Debug.LogWarning("找不到 UIManager！");
        }

        // 初始化 UI
        UpdateUI();
    }

    void Update()
    {
        // 按 ESC 鍵切換暫停
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            TogglePause();
        }

        // 按 R 鍵重新開始（在遊戲結束時）
        if (isGameOver && Input.GetKeyDown(KeyCode.R))
        {
            RestartGame();
        }
    }

    /// <summary>
    /// 增加分數
    /// </summary>
    public void AddScore(int points)
    {
        if (isGameOver) return;

        score += points;
        UpdateUI();

        Debug.Log($"分數增加: +{points}，總分: {score}");
    }

    /// <summary>
    /// 減少生命值
    /// </summary>
    public void LoseLife()
    {
        if (isGameOver) return;

        lives--;
        PlaySound(loseLifeSound);
        UpdateUI();

        Debug.Log($"失去生命！剩餘生命: {lives}");

        if (lives <= 0)
        {
            GameOver();
        }
    }

    /// <summary>
    /// 增加生命值
    /// </summary>
    public void GainLife()
    {
        if (isGameOver) return;

        if (lives < maxLives)
        {
            lives++;
            PlaySound(gainLifeSound);
            UpdateUI();

            Debug.Log($"獲得生命！當前生命: {lives}");
        }
    }

    /// <summary>
    /// 更新 UI 顯示
    /// </summary>
    void UpdateUI()
    {
        if (uiManager != null)
        {
            uiManager.UpdateScore(score);
            uiManager.UpdateLives(lives);
        }
    }

    /// <summary>
    /// 遊戲結束
    /// </summary>
    void GameOver()
    {
        isGameOver = true;
        PlaySound(gameOverSound);

        Debug.Log("遊戲結束！按 R 重新開始");

        // 顯示遊戲結束 UI
        if (uiManager != null)
        {
            uiManager.ShowGameOver();
        }

        // 停止時間流動（可選）
        // Time.timeScale = 0;
    }

    /// <summary>
    /// 關卡完成
    /// </summary>
    public void LevelComplete()
    {
        Debug.Log("關卡完成！");

        // 可以載入下一關卡或顯示勝利畫面
        if (uiManager != null)
        {
            uiManager.ShowLevelComplete();
        }
    }

    /// <summary>
    /// 重新開始遊戲
    /// </summary>
    public void RestartGame()
    {
        // 重置遊戲狀態
        score = 0;
        lives = 3;
        isPaused = false;
        isGameOver = false;

        // 恢復時間流動
        Time.timeScale = 1;

        // 重新載入當前場景
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);

        Debug.Log("遊戲重新開始");
    }

    /// <summary>
    /// 載入下一關卡
    /// </summary>
    public void LoadNextLevel()
    {
        int currentSceneIndex = SceneManager.GetActiveScene().buildIndex;
        int nextSceneIndex = currentSceneIndex + 1;

        if (nextSceneIndex < SceneManager.sceneCountInBuildSettings)
        {
            SceneManager.LoadScene(nextSceneIndex);
        }
        else
        {
            Debug.Log("沒有更多關卡了！");
            // 可以回到主選單或顯示全破畫面
        }
    }

    /// <summary>
    /// 切換暫停狀態
    /// </summary>
    public void TogglePause()
    {
        isPaused = !isPaused;

        if (isPaused)
        {
            Time.timeScale = 0; // 暫停時間
            if (uiManager != null)
            {
                uiManager.ShowPauseMenu();
            }
            Debug.Log("遊戲暫停");
        }
        else
        {
            Time.timeScale = 1; // 恢復時間
            if (uiManager != null)
            {
                uiManager.HidePauseMenu();
            }
            Debug.Log("遊戲繼續");
        }
    }

    /// <summary>
    /// 暫停遊戲
    /// </summary>
    public void PauseGame()
    {
        if (!isPaused)
        {
            TogglePause();
        }
    }

    /// <summary>
    /// 繼續遊戲
    /// </summary>
    public void ResumeGame()
    {
        if (isPaused)
        {
            TogglePause();
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
    /// 獲取當前分數
    /// </summary>
    public int GetScore()
    {
        return score;
    }

    /// <summary>
    /// 獲取當前生命值
    /// </summary>
    public int GetLives()
    {
        return lives;
    }

    /// <summary>
    /// 重置遊戲狀態（不重新載入場景）
    /// </summary>
    public void ResetGameState()
    {
        score = 0;
        lives = 3;
        isPaused = false;
        isGameOver = false;
        Time.timeScale = 1;
        UpdateUI();
    }
}
