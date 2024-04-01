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
    /// Interaction logic for AddItem.xaml
    /// </summary>
    public partial class AddItem : Window
    {
        MyTreeViewItem item=new MyTreeViewItem();
        MyTreeViewItem parentItem;

        public AddItem(MyTreeViewItem parent)
        {
            InitializeComponent();
            this.parentItem = parent;
        }

        private void add_Click(object sender, RoutedEventArgs e)
        {
            item.Header = header.Text;
            parentItem.Items.Add(item);
        }
    }
}
