using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows;

namespace wpf
{

    public class MyTreeViewItem : TreeViewItem
    {
        protected override void OnSelected(RoutedEventArgs e)
        {
            base.OnSelected(e);
            base.IsSelected = false;
        }
        protected override void OnMouseLeftButtonDown(MouseButtonEventArgs e)
        {
            base.IsExpanded = !base.IsExpanded;
        }

        protected override void OnMouseRightButtonDown(MouseButtonEventArgs e)
        {
            var w = new AddItem(this);
            w.Show();
        }
    }
    class MyTreeItemData
    {
        public string header { get; set; } = "";
        public List<MyTreeItemData> items { get; set; }= new List<MyTreeItemData>();
        public bool isExpanded { get; set; } = false;
    }

    class DataManager
    {

        public List<MyTreeItemData> data;

        string saveFile = "savedata/.json";

        public void save()
        {
            string dir=Path.GetDirectoryName(saveFile);
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            using(StreamWriter sw= new StreamWriter(saveFile))
            {
                
                string j=JsonSerializer.Serialize(data);
                sw.Write(j);
            }
        }

        public void loadTree(ItemCollection items)
        {

            if (!File.Exists(saveFile))
            {
                data= new List<MyTreeItemData>();
                save();
            }

            using (StreamReader fs = new StreamReader(saveFile))
            {
                string j = fs.ReadToEnd();
                data = JsonSerializer.Deserialize<List<MyTreeItemData>>(j);
                foreach(var d in data)
                {
                    items.Add(loadItem(d));
                }
            }
        }

        public MyTreeViewItem loadItem(MyTreeItemData itemData)
        {
            var item=new MyTreeViewItem();
            item.Header = itemData.header;
            item.IsExpanded = itemData.isExpanded;
            foreach (var childData in itemData.items)
            {
                var child = loadItem(childData);
                item.Items.Add(child);
            }
            return item;
        }

        public void dumpTree(ItemCollection treeViewItems)
        {
            data = dumpItem(treeViewItems);
            save();        }

        private List<MyTreeItemData> dumpItem(ItemCollection treeViewItems)
        {
            List<MyTreeItemData> ItemDataList= new List<MyTreeItemData>();
            foreach (TreeViewItem Item in treeViewItems)
            {
                MyTreeItemData ItemData=new MyTreeItemData();
                ItemData.items = dumpItem(Item.Items);
                ItemData.header = Item.Header.ToString();
                ItemData.isExpanded = Item.IsExpanded;

                ItemDataList.Add(ItemData);
            }

            return ItemDataList;
        }
    }
}
