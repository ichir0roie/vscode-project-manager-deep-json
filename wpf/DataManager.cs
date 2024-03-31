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
            base.IsExpanded = !base.IsExpanded;
        }
    }
    class MyTreeItemData
    {
        public string Header { get; set; } = "";
        public List<MyTreeItemData> Items { get; set; }= new List<MyTreeItemData>();
        public bool IsExpanded { get; set; } = false;
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

        public void load()
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
            }
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
                ItemData.Items = dumpItem(Item.Items);
                ItemData.Header = Item.Header.ToString();
                ItemData.IsExpanded = Item.IsExpanded;

                ItemDataList.Add(ItemData);
            }

            return ItemDataList;
        }
    }
}
