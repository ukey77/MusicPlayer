const sqlCommand = {
    viewAllData: "SELECT * FROM musiccontents",
    updateData: "UPDATE musiccontents SET isLiked=? WHERE id=?",
    viewIsLikedData: "SELECT id, title, artist, albumCover, audioDuration, isLiked FROM musiccontents WHERE isLiked=1"
}

module.exports = sqlCommand;