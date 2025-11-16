using UnityEngine;

/// <summary>
/// 相機平滑跟隨系統 - 讓相機跟隨玩家移動
/// </summary>
public class CameraFollow : MonoBehaviour
{
    [Header("跟隨設定")]
    [Tooltip("要跟隨的目標（通常是玩家）")]
    public Transform target;

    [Tooltip("跟隨平滑速度 (0-1，數值越大越快)")]
    [Range(0f, 1f)]
    public float smoothSpeed = 0.125f;

    [Tooltip("相機相對於目標的偏移量")]
    public Vector3 offset = new Vector3(0, 2, -10);

    [Header("邊界限制")]
    [Tooltip("是否使用邊界限制")]
    public bool useBounds = false;

    [Tooltip("X 軸最小值")]
    public float minX = 0;

    [Tooltip("X 軸最大值")]
    public float maxX = 50;

    [Tooltip("Y 軸最小值")]
    public float minY = 0;

    [Tooltip("Y 軸最大值")]
    public float maxY = 20;

    [Header("高級設定")]
    [Tooltip("是否只跟隨 X 軸")]
    public bool followXOnly = false;

    [Tooltip("是否只跟隨 Y 軸")]
    public bool followYOnly = false;

    [Tooltip("前瞻距離（玩家朝向方向的額外偏移）")]
    public float lookAheadDistance = 2f;

    private Vector3 velocity = Vector3.zero;

    void Start()
    {
        // 如果沒有設定目標，嘗試尋找帶有 "Player" 標籤的物件
        if (target == null)
        {
            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (player != null)
            {
                target = player.transform;
            }
            else
            {
                Debug.LogWarning("CameraFollow: 沒有找到目標物件！請設定 target 或為玩家添加 'Player' 標籤。");
            }
        }
    }

    void LateUpdate()
    {
        if (target == null) return;

        // 計算期望位置
        Vector3 desiredPosition = CalculateDesiredPosition();

        // 平滑移動到目標位置
        Vector3 smoothedPosition = Vector3.SmoothDamp(
            transform.position,
            desiredPosition,
            ref velocity,
            1f - smoothSpeed
        );

        // 應用位置
        transform.position = smoothedPosition;
    }

    /// <summary>
    /// 計算相機的期望位置
    /// </summary>
    Vector3 CalculateDesiredPosition()
    {
        Vector3 desiredPosition = target.position + offset;

        // 前瞻效果（根據玩家朝向添加偏移）
        if (lookAheadDistance > 0)
        {
            float direction = Mathf.Sign(target.localScale.x);
            desiredPosition.x += direction * lookAheadDistance;
        }

        // 軸限制
        if (followXOnly)
        {
            desiredPosition.y = transform.position.y;
        }
        else if (followYOnly)
        {
            desiredPosition.x = transform.position.x;
        }

        // 邊界限制
        if (useBounds)
        {
            desiredPosition.x = Mathf.Clamp(desiredPosition.x, minX, maxX);
            desiredPosition.y = Mathf.Clamp(desiredPosition.y, minY, maxY);
        }

        // 保持 Z 軸位置（2D 遊戲必須）
        desiredPosition.z = offset.z;

        return desiredPosition;
    }

    /// <summary>
    /// 設定新的跟隨目標
    /// </summary>
    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
    }

    /// <summary>
    /// 立即跳轉到目標位置（不平滑）
    /// </summary>
    public void SnapToTarget()
    {
        if (target == null) return;

        Vector3 desiredPosition = CalculateDesiredPosition();
        transform.position = desiredPosition;
        velocity = Vector3.zero;
    }

    /// <summary>
    /// 設定邊界
    /// </summary>
    public void SetBounds(float minX, float maxX, float minY, float maxY)
    {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
        useBounds = true;
    }

    /// <summary>
    /// 在編輯器中顯示相機邊界
    /// </summary>
    void OnDrawGizmosSelected()
    {
        if (!useBounds) return;

        Gizmos.color = Color.yellow;

        // 繪製邊界框
        Vector3 bottomLeft = new Vector3(minX, minY, 0);
        Vector3 bottomRight = new Vector3(maxX, minY, 0);
        Vector3 topRight = new Vector3(maxX, maxY, 0);
        Vector3 topLeft = new Vector3(minX, maxY, 0);

        Gizmos.DrawLine(bottomLeft, bottomRight);
        Gizmos.DrawLine(bottomRight, topRight);
        Gizmos.DrawLine(topRight, topLeft);
        Gizmos.DrawLine(topLeft, bottomLeft);
    }
}
