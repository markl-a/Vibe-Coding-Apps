"""
Model utility functions
"""
import torch
from typing import Dict, Any


def get_device() -> str:
    """
    Get available device (cuda/cpu)

    Returns:
        Device string
    """
    return 'cuda' if torch.cuda.is_available() else 'cpu'


def count_parameters(model: torch.nn.Module) -> int:
    """
    Count trainable parameters in model

    Args:
        model: PyTorch model

    Returns:
        Number of trainable parameters
    """
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


def get_model_info(model: torch.nn.Module) -> Dict[str, Any]:
    """
    Get model information

    Args:
        model: PyTorch model

    Returns:
        Dictionary with model info
    """
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = count_parameters(model)

    return {
        'total_parameters': total_params,
        'trainable_parameters': trainable_params,
        'non_trainable_parameters': total_params - trainable_params,
        'device': next(model.parameters()).device.type
    }


def save_checkpoint(
    model: torch.nn.Module,
    optimizer: torch.optim.Optimizer,
    epoch: int,
    loss: float,
    path: str
):
    """
    Save training checkpoint

    Args:
        model: PyTorch model
        optimizer: Optimizer
        epoch: Current epoch
        loss: Current loss
        path: Save path
    """
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
    }, path)
    print(f"Checkpoint saved to {path}")


def load_checkpoint(
    path: str,
    model: torch.nn.Module,
    optimizer: torch.optim.Optimizer = None
) -> Dict[str, Any]:
    """
    Load training checkpoint

    Args:
        path: Checkpoint path
        model: PyTorch model
        optimizer: Optional optimizer

    Returns:
        Checkpoint dictionary
    """
    checkpoint = torch.load(path)
    model.load_state_dict(checkpoint['model_state_dict'])

    if optimizer and 'optimizer_state_dict' in checkpoint:
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

    print(f"Checkpoint loaded from {path}")
    return checkpoint
