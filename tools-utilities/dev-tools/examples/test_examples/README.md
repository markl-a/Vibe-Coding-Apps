# Test Runner 範例

這個目錄包含測試執行的範例，展示 `test_runner.py` 的功能。

## 檔案說明

- `example_test_suite.py` - 完整的測試套件範例
- `pytest.ini` - Pytest 配置檔範例
- `conftest.py` - Pytest 共用 fixtures 和設定
- `test_config.yaml` - 自訂測試配置範例

## 使用範例

### 1. 執行所有測試

```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/dev-tools

# 執行所有測試
python test_runner.py

# 使用自訂測試目錄
python test_runner.py --test-dir examples/test_examples/
```

### 2. 執行特定測試

```bash
# 執行特定測試檔案
python test_runner.py examples/test_examples/example_test_suite.py

# 執行特定測試類別
python test_runner.py examples/test_examples/example_test_suite.py::TestCalculator

# 執行特定測試函數
python test_runner.py examples/test_examples/example_test_suite.py::test_data_structure
```

### 3. 使用測試標記

```bash
# 只執行單元測試
python test_runner.py -m unit

# 只執行整合測試
python test_runner.py -m integration

# 跳過慢速測試
python test_runner.py -m "not slow"

# 執行多個標記
python test_runner.py -m "unit and not slow"
```

### 4. 產生覆蓋率報告

```bash
# 執行測試並產生覆蓋率報告
python test_runner.py --coverage

# 產生 HTML 覆蓋率報告
python test_runner.py --coverage --html-report htmlcov/

# 產生 XML 覆蓋率報告（適用於 CI/CD）
python test_runner.py --coverage --xml-report coverage.xml
```

### 5. 平行執行測試

```bash
# 使用 4 個執行緒平行執行
python test_runner.py --parallel 4

# 使用所有可用 CPU 核心
python test_runner.py --parallel auto
```

### 6. 失敗重試

```bash
# 失敗的測試自動重試 3 次
python test_runner.py --retry 3

# 只重新執行上次失敗的測試
python test_runner.py --failed-only
```

### 7. 詳細輸出

```bash
# 顯示詳細輸出
python test_runner.py --verbose

# 顯示測試中的 print 輸出
python test_runner.py --show-capture

# 顯示最慢的 10 個測試
python test_runner.py --durations 10
```

### 8. 產生測試報告

```bash
# 產生 HTML 報告
python test_runner.py --html test_report.html

# 產生 JSON 報告
python test_runner.py --json test_report.json

# 產生 JUnit XML 報告（CI/CD 整合）
python test_runner.py --junit-xml junit.xml
```

## 測試類型範例

### 單元測試（Unit Tests）

```python
class TestCalculator(unittest.TestCase):
    def setUp(self):
        self.calc = Calculator()

    def test_add(self):
        self.assertEqual(self.calc.add(2, 3), 5)
```

### Pytest 風格測試

```python
def test_data_structure(sample_data):
    assert "users" in sample_data
    assert len(sample_data["users"]) == 2
```

### 參數化測試

```python
@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
])
def test_double(input, expected):
    assert input * 2 == expected
```

### Mock 測試

```python
def test_with_mock(self):
    mock_service = Mock()
    mock_service.send.return_value = True
    assert mock_service.send("test") == True
```

### 整合測試

```python
@pytest.mark.integration
def test_full_workflow():
    # 測試完整的業務流程
    pass
```

## Pytest 標記說明

### 內建標記

- `@pytest.mark.skip` - 跳過測試
- `@pytest.mark.skipif(condition)` - 條件跳過
- `@pytest.mark.xfail` - 預期失敗
- `@pytest.mark.parametrize` - 參數化測試

### 自訂標記

- `@pytest.mark.slow` - 慢速測試
- `@pytest.mark.integration` - 整合測試
- `@pytest.mark.unit` - 單元測試
- `@pytest.mark.smoke` - 冒煙測試

## Fixtures 範例

### 基本 Fixture

```python
@pytest.fixture
def sample_data():
    return {"key": "value"}

def test_example(sample_data):
    assert sample_data["key"] == "value"
```

### Scope Fixtures

```python
@pytest.fixture(scope="session")  # session, module, class, function
def database():
    db = setup_database()
    yield db
    teardown_database(db)
```

### 參數化 Fixtures

```python
@pytest.fixture(params=["option1", "option2"])
def config(request):
    return request.param
```

## 覆蓋率設定

### 最小覆蓋率要求

在 `pytest.ini` 中設定：

```ini
[coverage:report]
fail_under = 80  # 最小覆蓋率 80%
```

### 排除檔案

```ini
[coverage:run]
omit =
    */tests/*
    */test_*.py
```

## CI/CD 整合

### GitHub Actions

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    python test_runner.py --coverage --junit-xml junit.xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  script:
    - python test_runner.py --coverage --xml-report coverage.xml
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

## 常用命令組合

### 開發時

```bash
# 快速執行，跳過慢速測試
python test_runner.py -m "not slow" --verbose

# 只執行失敗的測試
python test_runner.py --failed-only --verbose
```

### CI/CD 時

```bash
# 完整測試 + 覆蓋率 + 報告
python test_runner.py \
    --coverage \
    --junit-xml junit.xml \
    --html test_report.html \
    --parallel auto
```

### 重構時

```bash
# 執行所有測試，顯示詳細資訊
python test_runner.py \
    --verbose \
    --show-capture \
    --durations 10
```

## 效能優化技巧

1. **使用平行執行** - 適合獨立的測試
2. **使用標記分組** - 分別執行不同類型的測試
3. **使用快取** - pytest 會快取執行結果
4. **跳過慢速測試** - 開發時跳過整合測試

## 最佳實踐

1. 測試應該獨立、可重複
2. 使用有意義的測試名稱
3. 使用 fixtures 共用設置程式碼
4. 參數化測試減少重複程式碼
5. 適當使用測試標記
6. 保持測試簡潔明確
7. 測試覆蓋率應達到 80% 以上

## 測試金字塔

```
        /\
       /  \
      /E2E \      少量端對端測試
     /------\
    /整合測試\    中量整合測試
   /----------\
  /  單元測試  \  大量單元測試
 /--------------\
```

建議比例：
- 單元測試：70%
- 整合測試：20%
- E2E 測試：10%
