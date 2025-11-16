using System.Windows;
using WpfNotesApp.ViewModels;

namespace WpfNotesApp
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            DataContext = new MainViewModel();
        }
    }
}
