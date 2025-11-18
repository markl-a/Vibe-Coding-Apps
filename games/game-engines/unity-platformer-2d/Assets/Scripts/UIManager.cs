using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// UI 管理器 - 管理遊戲中的所有 UI 元素
/// </summary>
public class UIManager : MonoBehaviour
{
    [Header("遊戲 UI")]
    [Tooltip("分數文字")]
    public Text scoreText;

    [Tooltip("生命值文字")]
    public Text livesText;

    [Tooltip("生命值條（血條）")]
    public Image healthBar;

    [Tooltip("生命值數值文字")]
    public Text healthText;

    [Tooltip("時間文字")]
    public Text timerText;

    [Header("選單 UI")]
    [Tooltip("暫停選單面板")]
    public GameObject pauseMenu;

    [Tooltip("遊戲結束面板")]
    public GameObject gameOverPanel;

    [Tooltip("關卡完成面板")]
    public GameObject levelCompletePanel;

    [Header("遊戲結束 UI")]
    [Tooltip("最終分數文字")]
    public Text finalScoreText;

    [Tooltip("最高分數文字")]
    public Text highScoreText;

    [Header("按鈕")]
    [Tooltip("繼續按鈕")]
    public Button resumeButton;

    [Tooltip("重新開始按鈕")]
    public Button restartButton;

    [Tooltip("主選單按鈕")]
    public Button mainMenuButton;

    [Header("生命值圖示")]
    [Tooltip("生命值圖示容器")]
    public Transform livesIconContainer;

    [Tooltip("生命值圖示預製體")]
    public GameObject lifeIconPrefab;

    private int currentLives = -1;

    void Start()
    {
        // 初始化 UI
        HidePauseMenu();
        HideGameOver();
        HideLevelComplete();

        // 設定按鈕事件
        SetupButtons();

        // 載入最高分數
        LoadHighScore();
    }

    /// <summary>
    /// 設定按鈕點擊事件
    /// </summary>
    void SetupButtons()
    {
        if (resumeButton != null)
        {
            resumeButton.onClick.AddListener(() => GameManager.Instance?.ResumeGame());
        }

        if (restartButton != null)
        {
            restartButton.onClick.AddListener(() => GameManager.Instance?.RestartGame());
        }

        // 主選單按鈕需要載入主選單場景（這裡簡化為重新開始）
        if (mainMenuButton != null)
        {
            mainMenuButton.onClick.AddListener(() => GameManager.Instance?.RestartGame());
        }
    }

    /// <summary>
    /// 更新分數顯示
    /// </summary>
    public void UpdateScore(int score)
    {
        if (scoreText != null)
        {
            scoreText.text = "分數: " + score.ToString();
        }
    }

    /// <summary>
    /// 更新生命值顯示（文字版）
    /// </summary>
    public void UpdateLives(int lives)
    {
        if (livesText != null)
        {
            livesText.text = "生命: " + lives.ToString();
        }

        // 如果使用圖示顯示生命值
        UpdateLivesIcons(lives);
    }

    /// <summary>
    /// 更新生命值圖示
    /// </summary>
    void UpdateLivesIcons(int lives)
    {
        if (livesIconContainer == null || lifeIconPrefab == null) return;
        if (currentLives == lives) return; // 數量沒變化就不更新

        currentLives = lives;

        // 清除現有圖示
        foreach (Transform child in livesIconContainer)
        {
            Destroy(child.gameObject);
        }

        // 生成新的生命值圖示
        for (int i = 0; i < lives; i++)
        {
            Instantiate(lifeIconPrefab, livesIconContainer);
        }
    }

    /// <summary>
    /// 更新生命值（血條版本）
    /// </summary>
    public void UpdateHealth(int currentHealth, int maxHealth)
    {
        // 更新血條
        if (healthBar != null)
        {
            float healthPercent = (float)currentHealth / maxHealth;
            healthBar.fillAmount = healthPercent;

            // 根據血量改變顏色
            if (healthPercent > 0.6f)
            {
                healthBar.color = Color.green;
            }
            else if (healthPercent > 0.3f)
            {
                healthBar.color = Color.yellow;
            }
            else
            {
                healthBar.color = Color.red;
            }
        }

        // 更新生命值文字
        if (healthText != null)
        {
            healthText.text = $"{currentHealth} / {maxHealth}";
        }
    }

    /// <summary>
    /// 更新計時器顯示
    /// </summary>
    public void UpdateTimer(float time)
    {
        if (timerText != null)
        {
            int minutes = Mathf.FloorToInt(time / 60);
            int seconds = Mathf.FloorToInt(time % 60);
            timerText.text = string.Format("時間: {0:00}:{1:00}", minutes, seconds);
        }
    }

    /// <summary>
    /// 顯示暫停選單
    /// </summary>
    public void ShowPauseMenu()
    {
        if (pauseMenu != null)
        {
            pauseMenu.SetActive(true);
        }
    }

    /// <summary>
    /// 隱藏暫停選單
    /// </summary>
    public void HidePauseMenu()
    {
        if (pauseMenu != null)
        {
            pauseMenu.SetActive(false);
        }
    }

    /// <summary>
    /// 顯示遊戲結束畫面
    /// </summary>
    public void ShowGameOver()
    {
        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(true);

            // 更新最終分數
            if (finalScoreText != null && GameManager.Instance != null)
            {
                int finalScore = GameManager.Instance.GetScore();
                finalScoreText.text = "最終分數: " + finalScore;

                // 檢查並更新最高分數
                UpdateHighScore(finalScore);
            }
        }
    }

    /// <summary>
    /// 隱藏遊戲結束畫面
    /// </summary>
    public void HideGameOver()
    {
        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(false);
        }
    }

    /// <summary>
    /// 顯示關卡完成畫面
    /// </summary>
    public void ShowLevelComplete()
    {
        if (levelCompletePanel != null)
        {
            levelCompletePanel.SetActive(true);
        }
    }

    /// <summary>
    /// 隱藏關卡完成畫面
    /// </summary>
    public void HideLevelComplete()
    {
        if (levelCompletePanel != null)
        {
            levelCompletePanel.SetActive(false);
        }
    }

    /// <summary>
    /// 載入最高分數
    /// </summary>
    void LoadHighScore()
    {
        int highScore = PlayerPrefs.GetInt("HighScore", 0);
        if (highScoreText != null)
        {
            highScoreText.text = "最高分: " + highScore;
        }
    }

    /// <summary>
    /// 更新最高分數
    /// </summary>
    void UpdateHighScore(int newScore)
    {
        int currentHighScore = PlayerPrefs.GetInt("HighScore", 0);

        if (newScore > currentHighScore)
        {
            PlayerPrefs.SetInt("HighScore", newScore);
            PlayerPrefs.Save();

            if (highScoreText != null)
            {
                highScoreText.text = "最高分: " + newScore + " (新紀錄!)";
            }

            Debug.Log("新的最高分數: " + newScore);
        }
        else
        {
            if (highScoreText != null)
            {
                highScoreText.text = "最高分: " + currentHighScore;
            }
        }
    }

    /// <summary>
    /// 顯示提示訊息
    /// </summary>
    public void ShowMessage(string message, float duration = 2f)
    {
        // 這裡可以實現浮動文字或提示框
        Debug.Log("訊息: " + message);
        // TODO: 實現臨時訊息顯示
    }

    /// <summary>
    /// 淡入效果
    /// </summary>
    public void FadeIn(CanvasGroup canvasGroup, float duration = 1f)
    {
        if (canvasGroup != null)
        {
            StartCoroutine(FadeCanvasGroup(canvasGroup, canvasGroup.alpha, 1f, duration));
        }
    }

    /// <summary>
    /// 淡出效果
    /// </summary>
    public void FadeOut(CanvasGroup canvasGroup, float duration = 1f)
    {
        if (canvasGroup != null)
        {
            StartCoroutine(FadeCanvasGroup(canvasGroup, canvasGroup.alpha, 0f, duration));
        }
    }

    /// <summary>
    /// Canvas Group 淡入淡出協程
    /// </summary>
    System.Collections.IEnumerator FadeCanvasGroup(CanvasGroup cg, float start, float end, float duration)
    {
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            cg.alpha = Mathf.Lerp(start, end, elapsed / duration);
            yield return null;
        }

        cg.alpha = end;
    }
}
