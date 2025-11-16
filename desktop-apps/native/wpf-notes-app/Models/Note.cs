using System;
using System.Collections.Generic;

namespace WpfNotesApp.Models
{
    public class Note
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ModifiedAt { get; set; }
        public string Category { get; set; } = "一般";
        public List<string> Tags { get; set; } = new();
        public bool IsFavorite { get; set; }

        public Note()
        {
            Id = Guid.NewGuid();
            CreatedAt = DateTime.Now;
            ModifiedAt = DateTime.Now;
        }

        public void UpdateModifiedTime()
        {
            ModifiedAt = DateTime.Now;
        }
    }
}
