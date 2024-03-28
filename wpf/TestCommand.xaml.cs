using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace wpf
{
    /// <summary>
    /// Interaction logic for TestCommand.xaml
    /// </summary>
    public partial class TestCommand : Window
    {
        public TestCommand()
        {
            InitializeComponent();
        }
        private void testButton1_Click(object sender, RoutedEventArgs e)
        {
            System.Diagnostics.Process.Start(
                testText.Text,
                testText2.Text
                );
        }

        private void testButton2_Click(object sender, RoutedEventArgs e)
        {

        }
    }
}
