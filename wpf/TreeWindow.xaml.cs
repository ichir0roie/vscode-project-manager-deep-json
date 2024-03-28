using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

//https://stackoverflow.com/questions/2927785/stretch-empty-wpf-listview-to-take-the-remaining-space
namespace wpf
{

    /// <summary>
    /// Interaction logic for TreeWindow.xaml
    /// </summary>
    public partial class TreeWindow : Window
    {
        public TreeWindow()
        {
            InitializeComponent();

            //https://learn.microsoft.com/ja-jp/dotnet/desktop/wpf/advanced/optimizing-performance-layout-and-design?view=netframeworkdesktop-4.8&viewFallbackFrom=netdesktop-8.0

            //TextBlock textBlock = new TextBlock();
            //textBlock.Text = "Default";

            //DockPanel parentPanel = new DockPanel();
            ////DockPanel childPanel;

            //myCanvas.Children.Add(parentPanel);
            //myCanvas.Children.Add(textBlock);



            generateTree();
        }
        //TODO save state isExpand

        private void generateTree()
        {

            JsonObject data = getDictionary();


            for (int i = 0; i < 10; i++)
            {
                MyTreeViewItem parentItem = new MyTreeViewItem();
                parentItem.Header = String.Format("testextestext{0}", i);
                for (int j = 0; j < 10; j++)
                {
                    MyTreeViewItem childItem = new MyTreeViewItem();
                    childItem.Header = String.Format("testextestext{0},{1}", i, j);
                    parentItem.Items.Add(childItem);
                }
                treeView.Items.Add(parentItem);
            }
        }

        private MyTreeViewItem getTree(JsonObject jo)
        {
            MyTreeViewItem item= new MyTreeViewItem();
            
            

            return item;
        }

        private JsonObject getDictionary()
        {
            JsonObject data = new JsonObject();
            
            return data;
        }

        private void treeView_SelectedItemChanged(object sender, RoutedPropertyChangedEventArgs<object> e)
        {
            MyTreeViewItem item = (MyTreeViewItem)e.NewValue;

            if (item.Items.Count > 0) return;

            text.Text = item.Header.ToString();
        }

        private void ScrollViewer_PreviewMouseWheel(object sender, MouseWheelEventArgs e)
        {

            ScrollViewer scv = (ScrollViewer)sender;
            scv.ScrollToVerticalOffset(scv.VerticalOffset - e.Delta);
            e.Handled = true;
            //TODO horizontal
        }
    }

    class MyTreeViewItem : TreeViewItem
    {
        protected override void OnSelected(RoutedEventArgs e)
        {
            base.OnSelected(e);
            base.IsSelected = false;
        }
        protected override void OnMouseLeftButtonDown(MouseButtonEventArgs e)
        {
            base.OnMouseLeftButtonDown(e);
            base.IsExpanded=!base.IsExpanded;
        }
    }
}
