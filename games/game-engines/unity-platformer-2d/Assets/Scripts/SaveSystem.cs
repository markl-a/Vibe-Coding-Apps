using UnityEngine;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;

/// <summary>
/// 存檔系統 - 使用 JSON 格式保存遊戲數據
/// AI-Generated Template
/// </summary>
public static class SaveSystem
{
    private static readonly string savePath = Application.persistentDataPath + "/savegame.json";

    /// <summary>
    /// 保存遊戲數據
    /// </summary>
    public static void SaveGame(GameData data)
    {
        try
        {
            string json = JsonUtility.ToJson(data, true);
            File.WriteAllText(savePath, json);
            Debug.Log($"遊戲已保存到: {savePath}");
        }
        catch (System.Exception e)
        {
            Debug.LogError($"保存遊戲失敗: {e.Message}");
        }
    }

    /// <summary>
    /// 載入遊戲數據
    /// </summary>
    public static GameData LoadGame()
    {
        if (!File.Exists(savePath))
        {
            Debug.LogWarning("找不到存檔文件，返回默認數據");
            return new GameData();
        }

        try
        {
            string json = File.ReadAllText(savePath);
            GameData data = JsonUtility.FromJson<GameData>(json);
            Debug.Log($"遊戲已載入: {savePath}");
            return data;
        }
        catch (System.Exception e)
        {
            Debug.LogError($"載入遊戲失敗: {e.Message}");
            return new GameData();
        }
    }

    /// <summary>
    /// 檢查是否存在存檔
    /// </summary>
    public static bool HasSaveData()
    {
        return File.Exists(savePath);
    }

    /// <summary>
    /// 刪除存檔
    /// </summary>
    public static void DeleteSave()
    {
        if (File.Exists(savePath))
        {
            File.Delete(savePath);
            Debug.Log("存檔已刪除");
        }
    }

    /// <summary>
    /// 獲取存檔路徑
    /// </summary>
    public static string GetSavePath()
    {
        return savePath;
    }
}

/// <summary>
/// 遊戲數據類別 - 定義要保存的所有數據
/// </summary>
[System.Serializable]
public class GameData
{
    // 玩家數據
    public int playerHealth = 100;
    public int playerMaxHealth = 100;
    public Vector3Data playerPosition = new Vector3Data(0, 0, 0);

    // 遊戲進度
    public int currentLevel = 1;
    public int score = 0;
    public int lives = 3;
    public int coinsCollected = 0;

    // 解鎖內容
    public bool[] levelsUnlocked = new bool[10];
    public bool[] achievementsUnlocked = new bool[20];

    // 遊戲設置
    public float musicVolume = 0.7f;
    public float sfxVolume = 0.8f;
    public bool fullscreen = true;

    // 統計數據
    public float totalPlayTime = 0f;
    public int totalDeaths = 0;
    public int totalJumps = 0;
    public int totalEnemiesKilled = 0;

    // 時間戳
    public string lastSaveTime = "";

    /// <summary>
    /// 構造函數 - 初始化默認值
    /// </summary>
    public GameData()
    {
        // 默認解鎖第一關
        levelsUnlocked[0] = true;

        // 記錄保存時間
        lastSaveTime = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    }
}

/// <summary>
/// Vector3 的可序列化版本
/// </summary>
[System.Serializable]
public class Vector3Data
{
    public float x;
    public float y;
    public float z;

    public Vector3Data(float x, float y, float z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public Vector3Data(Vector3 vector)
    {
        x = vector.x;
        y = vector.y;
        z = vector.z;
    }

    public Vector3 ToVector3()
    {
        return new Vector3(x, y, z);
    }
}

/// <summary>
/// SaveManager - 管理存檔的 MonoBehaviour 組件
/// 可以附加到 GameManager 或單獨的對象上
/// </summary>
public class SaveManager : MonoBehaviour
{
    private static SaveManager instance;
    public static SaveManager Instance
    {
        get
        {
            if (instance == null)
            {
                instance = FindObjectOfType<SaveManager>();
                if (instance == null)
                {
                    GameObject obj = new GameObject("SaveManager");
                    instance = obj.AddComponent<SaveManager>();
                    DontDestroyOnLoad(obj);
                }
            }
            return instance;
        }
    }

    private GameData currentGameData;

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }

    /// <summary>
    /// 保存當前遊戲狀態
    /// </summary>
    public void SaveCurrentGame()
    {
        GameData data = new GameData();

        // 收集玩家數據
        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player != null)
        {
            PlayerHealth health = player.GetComponent<PlayerHealth>();
            if (health != null)
            {
                data.playerHealth = health.GetCurrentHealth();
                data.playerMaxHealth = health.GetMaxHealth();
            }

            data.playerPosition = new Vector3Data(player.transform.position);
        }

        // 收集遊戲管理器數據
        if (GameManager.Instance != null)
        {
            data.score = GameManager.Instance.score;
            data.lives = GameManager.Instance.lives;
        }

        // 更新時間戳
        data.lastSaveTime = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

        // 保存數據
        SaveSystem.SaveGame(data);
        currentGameData = data;
    }

    /// <summary>
    /// 載入遊戲
    /// </summary>
    public GameData LoadGame()
    {
        currentGameData = SaveSystem.LoadGame();
        return currentGameData;
    }

    /// <summary>
    /// 應用載入的數據到遊戲
    /// </summary>
    public void ApplyLoadedData(GameData data)
    {
        // 應用到玩家
        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player != null)
        {
            PlayerHealth health = player.GetComponent<PlayerHealth>();
            if (health != null)
            {
                health.SetHealth(data.playerHealth);
            }

            player.transform.position = data.playerPosition.ToVector3();
        }

        // 應用到遊戲管理器
        if (GameManager.Instance != null)
        {
            GameManager.Instance.score = data.score;
            GameManager.Instance.lives = data.lives;
        }

        Debug.Log($"已應用存檔數據 - 分數: {data.score}, 生命: {data.lives}");
    }

    /// <summary>
    /// 自動保存（每隔一段時間）
    /// </summary>
    public void StartAutoSave(float interval = 60f)
    {
        InvokeRepeating(nameof(SaveCurrentGame), interval, interval);
    }

    /// <summary>
    /// 停止自動保存
    /// </summary>
    public void StopAutoSave()
    {
        CancelInvoke(nameof(SaveCurrentGame));
    }
}
