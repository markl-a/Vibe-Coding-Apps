using UnityEngine;

/// <summary>
/// 移動平台 - 在多個點之間移動
/// AI-Generated Template
/// </summary>
public class MovingPlatform : MonoBehaviour
{
    [Header("移動設定")]
    [Tooltip("移動速度")]
    public float speed = 2f;

    [Tooltip("移動點（相對於起始位置）")]
    public Vector3[] waypoints = new Vector3[]
    {
        new Vector3(0, 0, 0),
        new Vector3(5, 0, 0)
    };

    [Tooltip("到達目標點的距離閾值")]
    public float waypointThreshold = 0.1f;

    [Tooltip("到達終點後是否循環")]
    public bool loop = true;

    [Tooltip("到達終點後是否來回移動")]
    public bool pingPong = true;

    [Tooltip("在每個點停留的時間")]
    public float waitTime = 0.5f;

    [Header("玩家跟隨")]
    [Tooltip("玩家是否跟隨平台移動")]
    public bool movePlayer = true;

    // 內部變數
    private Vector3[] worldWaypoints;
    private int currentWaypointIndex = 0;
    private bool movingForward = true;
    private float waitTimer = 0f;
    private bool isWaiting = false;
    private Vector3 lastPosition;

    void Start()
    {
        // 將相對位置轉換為世界座標
        worldWaypoints = new Vector3[waypoints.Length];
        for (int i = 0; i < waypoints.Length; i++)
        {
            worldWaypoints[i] = transform.position + waypoints[i];
        }

        // 初始化位置
        if (worldWaypoints.Length > 0)
        {
            transform.position = worldWaypoints[0];
        }

        lastPosition = transform.position;
    }

    void Update()
    {
        if (worldWaypoints.Length == 0) return;

        // 處理等待
        if (isWaiting)
        {
            waitTimer -= Time.deltaTime;
            if (waitTimer <= 0)
            {
                isWaiting = false;
            }
            return;
        }

        // 移動平台
        Vector3 targetPosition = worldWaypoints[currentWaypointIndex];
        Vector3 newPosition = Vector3.MoveTowards(transform.position, targetPosition, speed * Time.deltaTime);

        // 記錄位置變化（用於玩家跟隨）
        Vector3 deltaPosition = newPosition - transform.position;
        transform.position = newPosition;

        // 檢查是否到達目標點
        if (Vector3.Distance(transform.position, targetPosition) < waypointThreshold)
        {
            OnReachWaypoint();
        }

        lastPosition = transform.position;
    }

    /// <summary>
    /// 到達路徑點時的處理
    /// </summary>
    void OnReachWaypoint()
    {
        // 開始等待
        if (waitTime > 0)
        {
            isWaiting = true;
            waitTimer = waitTime;
        }

        // 計算下一個目標點
        if (pingPong)
        {
            // 來回模式
            if (movingForward)
            {
                currentWaypointIndex++;
                if (currentWaypointIndex >= worldWaypoints.Length)
                {
                    currentWaypointIndex = worldWaypoints.Length - 2;
                    movingForward = false;
                }
            }
            else
            {
                currentWaypointIndex--;
                if (currentWaypointIndex < 0)
                {
                    currentWaypointIndex = 1;
                    movingForward = true;
                }
            }
        }
        else if (loop)
        {
            // 循環模式
            currentWaypointIndex = (currentWaypointIndex + 1) % worldWaypoints.Length;
        }
        else
        {
            // 單次模式 - 到達終點後停止
            currentWaypointIndex++;
            if (currentWaypointIndex >= worldWaypoints.Length)
            {
                currentWaypointIndex = worldWaypoints.Length - 1;
                enabled = false; // 停止更新
            }
        }
    }

    /// <summary>
    /// 玩家站在平台上時跟隨平台移動
    /// </summary>
    void OnCollisionStay2D(Collision2D collision)
    {
        if (!movePlayer) return;

        if (collision.gameObject.CompareTag("Player"))
        {
            // 檢查玩家是否在平台上方
            if (collision.contacts[0].normal.y < -0.5f)
            {
                // 移動玩家
                Vector3 deltaPosition = transform.position - lastPosition;
                collision.transform.position += deltaPosition;
            }
        }
    }

    /// <summary>
    /// 繪製 Gizmos - 顯示移動路徑
    /// </summary>
    void OnDrawGizmos()
    {
        if (waypoints == null || waypoints.Length == 0) return;

        Gizmos.color = Color.cyan;

        // 在編輯器中顯示路徑
        Vector3 startPos = Application.isPlaying && worldWaypoints != null ? worldWaypoints[0] : transform.position;

        for (int i = 0; i < waypoints.Length; i++)
        {
            Vector3 worldPos = Application.isPlaying && worldWaypoints != null
                ? worldWaypoints[i]
                : transform.position + waypoints[i];

            // 繪製路徑點
            Gizmos.DrawWireSphere(worldPos, 0.3f);

            // 繪製連線
            if (i > 0)
            {
                Vector3 prevWorldPos = Application.isPlaying && worldWaypoints != null
                    ? worldWaypoints[i - 1]
                    : transform.position + waypoints[i - 1];
                Gizmos.DrawLine(prevWorldPos, worldPos);
            }

            // 如果是循環或來回模式，連接最後一個點和第一個點
            if (i == waypoints.Length - 1 && (loop || pingPong))
            {
                if (loop && !pingPong)
                {
                    Gizmos.DrawLine(worldPos, startPos);
                }
                else if (pingPong)
                {
                    Gizmos.color = Color.yellow;
                    Gizmos.DrawLine(worldPos, startPos);
                    Gizmos.color = Color.cyan;
                }
            }
        }
    }

    /// <summary>
    /// 重置平台到初始狀態
    /// </summary>
    public void ResetPlatform()
    {
        currentWaypointIndex = 0;
        movingForward = true;
        isWaiting = false;
        waitTimer = 0f;

        if (worldWaypoints != null && worldWaypoints.Length > 0)
        {
            transform.position = worldWaypoints[0];
        }

        enabled = true;
    }
}
