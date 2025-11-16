"""
測試程式碼生成器
"""

import pytest
import sys
from pathlib import Path

# 添加父目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from code_generator import CodeGenerator


class TestCodeGenerator:
    """測試 CodeGenerator 類別"""

    def test_init(self):
        """測試初始化"""
        generator = CodeGenerator()
        assert generator.output_dir == Path('.')

    def test_init_with_output_dir(self):
        """測試指定輸出目錄"""
        generator = CodeGenerator(output_dir='/tmp/test')
        assert generator.output_dir == Path('/tmp/test')

    def test_has_templates(self):
        """測試範本存在"""
        generator = CodeGenerator()
        assert 'python-api' in generator.templates
        assert 'python-cli' in generator.templates
        assert 'crud' in generator.templates
        assert 'test' in generator.templates
        assert 'api-endpoint' in generator.templates

    def test_generate_python_api_project(self, tmp_path):
        """測試生成 Python API 專案"""
        generator = CodeGenerator(output_dir=str(tmp_path))
        result = generator.generate_project('python-api', 'testapi')

        assert result['project_type'] == 'python-api'
        assert result['name'] == 'testapi'
        assert len(result['files']) > 0

        # 檢查生成的檔案
        main_file = tmp_path / 'testapi' / 'main.py'
        assert main_file.exists()

    def test_generate_crud_code(self, tmp_path):
        """測試生成 CRUD 程式碼"""
        generator = CodeGenerator(output_dir=str(tmp_path))
        result = generator.generate_project(
            'crud', 'User',
            fields='name:str,age:int,email:str'
        )

        assert result['project_type'] == 'crud'
        assert result['name'] == 'User'

        # 檢查生成的檔案
        model_file = tmp_path / 'user_model.py'
        crud_file = tmp_path / 'user_crud.py'
        assert model_file.exists()
        assert crud_file.exists()

    def test_invalid_project_type(self):
        """測試無效的專案類型"""
        generator = CodeGenerator()
        with pytest.raises(ValueError, match="不支援的專案類型"):
            generator.generate_project('invalid-type', 'test')


def test_code_generator_can_be_imported():
    """測試可以匯入 CodeGenerator"""
    from code_generator import CodeGenerator
    assert CodeGenerator is not None
