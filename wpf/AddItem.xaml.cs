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

        DataManager dm;

        public AddItem()
        {
            InitializeComponent();
            dm = new DataManager();
            dm.load();
        }

        private void add_Click(object sender, RoutedEventArgs e)
        {
            MyTreeItemData item = new MyTreeItemData();
            item.Header = header.Text;
            dm.data.Add(item);

            dm.save();
        }
    }
}
